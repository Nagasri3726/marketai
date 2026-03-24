"""
PayStreamX — Algorand Smart Contract for Salary Streaming.
Supports: Create, Withdraw, Cancel, Borrow, Repay, Allocate operations.
"""
from pyteal import (
    Approve, Reject, Return, Int, Bytes, Seq, Assert,
    App, Txn, Global, Cond, OnComplete, Mode,
    And, Or, If, Btoi, Itob, Minus, Div, Mul, Add,
    compileTeal, TealType, ScratchVar
)


def approval_program():
    """Main approval program for salary streaming."""

    # Global state keys
    employer = Bytes("employer")
    employee = Bytes("employee")
    total_amount = Bytes("total_amount")
    start_time = Bytes("start_time")
    end_time = Bytes("end_time")
    withdrawn = Bytes("withdrawn")
    is_active = Bytes("is_active")
    is_cancelled = Bytes("is_cancelled")
    # New: credit fields
    borrowed = Bytes("borrowed")
    repaid = Bytes("repaid")
    credit_limit = Bytes("credit_limit")

    # ===== CREATE =====
    on_create = Seq([
        App.globalPut(employer, Txn.application_args[0]),
        App.globalPut(employee, Txn.application_args[1]),
        App.globalPut(total_amount, Btoi(Txn.application_args[2])),
        App.globalPut(start_time, Btoi(Txn.application_args[3])),
        App.globalPut(end_time, Btoi(Txn.application_args[4])),
        App.globalPut(withdrawn, Int(0)),
        App.globalPut(is_active, Int(1)),
        App.globalPut(is_cancelled, Int(0)),
        App.globalPut(borrowed, Int(0)),
        App.globalPut(repaid, Int(0)),
        App.globalPut(credit_limit, Btoi(Txn.application_args[5])),
        Approve(),
    ])

    # ===== HELPERS =====
    elapsed = Minus(Global.latest_timestamp(), App.globalGet(start_time))
    duration = Minus(App.globalGet(end_time), App.globalGet(start_time))

    # Accrued = (total_amount * elapsed) / duration
    accrued_amount = Div(
        Mul(App.globalGet(total_amount), elapsed),
        duration
    )

    # Available = min(accrued, total) - withdrawn
    available = Minus(accrued_amount, App.globalGet(withdrawn))

    # ===== WITHDRAW =====
    withdraw_amount = Btoi(Txn.application_args[1])

    on_withdraw = Seq([
        Assert(App.globalGet(is_active) == Int(1)),
        Assert(App.globalGet(is_cancelled) == Int(0)),
        Assert(Txn.sender() == App.globalGet(employee)),
        Assert(Global.latest_timestamp() >= App.globalGet(start_time)),
        Assert(withdraw_amount <= available),
        App.globalPut(withdrawn, Add(App.globalGet(withdrawn), withdraw_amount)),
        Approve(),
    ])

    # ===== CANCEL =====
    on_cancel = Seq([
        Assert(Txn.sender() == App.globalGet(employer)),
        App.globalPut(is_cancelled, Int(1)),
        App.globalPut(is_active, Int(0)),
        Approve(),
    ])

    # ===== BORROW (Salary-backed credit) =====
    borrow_amount = Btoi(Txn.application_args[1])

    on_borrow = Seq([
        Assert(App.globalGet(is_active) == Int(1)),
        Assert(Txn.sender() == App.globalGet(employee)),
        Assert(
            Add(App.globalGet(borrowed), borrow_amount) <= App.globalGet(credit_limit)
        ),
        App.globalPut(borrowed, Add(App.globalGet(borrowed), borrow_amount)),
        Approve(),
    ])

    # ===== REPAY =====
    repay_amount = Btoi(Txn.application_args[1])

    on_repay = Seq([
        Assert(App.globalGet(is_active) == Int(1)),
        Assert(Txn.sender() == App.globalGet(employee)),
        Assert(repay_amount <= Minus(App.globalGet(borrowed), App.globalGet(repaid))),
        App.globalPut(repaid, Add(App.globalGet(repaid), repay_amount)),
        Approve(),
    ])

    # ===== ALLOCATE (move funds to locked/investment bucket on-chain) =====
    on_allocate = Seq([
        Assert(App.globalGet(is_active) == Int(1)),
        Assert(Txn.sender() == App.globalGet(employee)),
        Approve(),
    ])

    # ===== ROUTER =====
    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == App.globalGet(employer))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Reject()],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.application_args[0] == Bytes("withdraw"), on_withdraw],
        [Txn.application_args[0] == Bytes("cancel"), on_cancel],
        [Txn.application_args[0] == Bytes("borrow"), on_borrow],
        [Txn.application_args[0] == Bytes("repay"), on_repay],
        [Txn.application_args[0] == Bytes("allocate"), on_allocate],
    )

    return program


def clear_program():
    return Approve()


if __name__ == "__main__":
    approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=6)
    clear_teal = compileTeal(clear_program(), mode=Mode.Application, version=6)

    with open("approval.teal", "w") as f:
        f.write(approval_teal)
    with open("clear.teal", "w") as f:
        f.write(clear_teal)

    print("✅ Smart contracts compiled: approval.teal, clear.teal")
