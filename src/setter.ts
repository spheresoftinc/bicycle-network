import { BicycleNetwork } from "./bicycleNetwork";
import { AnyField, FieldCode, Field } from "./field";

export enum PriorityLevel {
    targeted = 0,
    normal,
    notCalced
}

export class AnySetter {
    
    network?: BicycleNetwork
    canCalculate: boolean = true
    priorityLevel = PriorityLevel.normal
    insertOrder: number = 0

    public constructor(priorityLevel: PriorityLevel = PriorityLevel.normal) {
        this.priorityLevel = priorityLevel
    }

    public lessThan(rhs: AnySetter): boolean {
        if (this.priorityLevel != rhs.priorityLevel) {
            return this.priorityLevel < rhs.priorityLevel
        }

        if (this.anyTarget().hasNoTargettingCalcs() && !rhs.anyTarget().hasNoTargettingCalcs()) {
            return true
        } else if (!this.anyTarget().hasNoTargettingCalcs() && rhs.anyTarget().hasNoTargettingCalcs()) {
            return false
        } else if (this.isUserProvided() && !rhs.isUserProvided()) {
            return true
        } else if (!this.isUserProvided() && rhs.isUserProvided()) {
            return false
        }

        return this.insertOrder > rhs.insertOrder
    }

    anyTarget(): AnyField {
        // This line is here for the compiler. If you get here, it's programmer error.
        return new AnyField()
    }

    shouldCountAsCalc(): boolean {
        return false
    }

    isUserProvided(): boolean {
        return false
    }

    setField(): boolean {
        return false
    }

    resetField(): void {
        // assert(anyTarget().code == .calced)
        this.anyTarget().code = FieldCode.clear
    }

    isMatch(field: AnyField): boolean {
        return this.anyTarget() === field
    }
}

export class SetterConstant<T> extends AnySetter {

    target: Field<T>
    value: T

    public constructor(target: Field<T>, value: T, priorityLevel: PriorityLevel = PriorityLevel.normal) {
        super(priorityLevel)
        this.target = target
        this.value = value
    }

    anyTarget(): AnyField {
        return this.target
    }

    isUserProvided(): boolean {
        return true
    }

    setField(): boolean {
        if (this.target.code == FieldCode.clear) {
            if (this.target.setValue(this.value, FieldCode.set)) {
                return true
            } else {
                // don't use resetfield, because in this case,
                // the code is set, not calced, and
                // the assert will fail.
                this.target.code = FieldCode.clear
                return false
            }
        }
        return false
    }
}