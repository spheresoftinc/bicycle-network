import { BicycleNetwork } from "./bicycleNetwork";
import { AnyCalculator } from "./calculator";
import { AnyCalculatorFactory } from "./calculatorFactory";

export enum FieldCode {
    clear,
    set,
    calced,
    defaultValue,
    implied
}

export class FieldID {
    id: symbol = Symbol()
}

export class AnyField {
    public id: FieldID = new FieldID()
    network?: BicycleNetwork

    public code: FieldCode = FieldCode.clear
    
    dependents: Set<AnyCalculator> = new Set()
    static calculatorFactories: AnyCalculatorFactory[] = []

    clear(): void {
        this.dependents.clear()
    }

    addDependent(calculator: AnyCalculator): void {
        this.dependents.add(calculator)
    }

    dropDependent(calculator: AnyCalculator): void {
        this.dependents.delete(calculator)
    }

    propagate(): boolean {
        for (let dependent of this.dependents) {
            if (dependent.setField()) {
                // Do nothing when propagation succeeds.
            } else {
                return false
            }
        }
        return true
    }

    numTargettingCalcs: number = 0

    zeroNumTargettingCalculators(): void {
        this.numTargettingCalcs = 0
    }

    incrementNumTargettingCalculators(): void {
        this.numTargettingCalcs++
    }

    hasNoTargettingCalcs(): boolean {
        return this.numTargettingCalcs == 0
    }

    static registerCalcFactory(calculatorFactory: AnyCalculatorFactory): void {
        AnyField.calculatorFactories.push(calculatorFactory)
    }
}

export class Field<T> extends AnyField {
    
    maybeValue?: T = undefined

    public setValue(value: T, code: FieldCode): boolean {
        this.maybeValue = value
        this.code = code
        return this.propagate()
    }

    public value(): T {
        // it is a programmer error to call this if code is clear
        return this.maybeValue!
    }
}