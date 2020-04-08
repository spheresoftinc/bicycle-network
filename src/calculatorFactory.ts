import { BicycleNetwork } from "./bicycleNetwork";
import { AnyCalculator, Calculator1Op, Calculator2Op } from "./calculator";
import { AnyField, Field, FieldID } from "./field";

export class AnyCalculatorFactory {

    constructor() {
        AnyField.registerCalcFactory(this)
    }

    makeOrphanCalculator(network: BicycleNetwork): (AnyCalculator | undefined) {
        return undefined
    }
}

export class Calculator1OpFactory<TTarget, TOperand1> extends AnyCalculatorFactory {
    targetId: FieldID
    operand1Id: FieldID

    calcFn: (operand1: TOperand1) => TTarget

    constructor(targetId: FieldID, operand1Id: FieldID, calcFn: (operand1: TOperand1) => TTarget) {
        super()
        this.targetId = targetId
        this.operand1Id = operand1Id
        this.calcFn = calcFn
    }

    public static registerFactory<TTarget, TOperand1>(targetId: FieldID, operand1Id: FieldID, calcFn: (operand1: TOperand1) => TTarget): void {
        new Calculator1OpFactory<TTarget, TOperand1>(targetId, operand1Id, calcFn)
    }

    makeOrphanCalculator(network: BicycleNetwork): (AnyCalculator | undefined) {
        let targetField = network.getField(this.targetId) as Field<TTarget>
        let operand1Field = network.getField(this.operand1Id) as Field<TOperand1>
        if (targetField == undefined || operand1Field == undefined) {
            return undefined
        }
        
        return new Calculator1Op<TTarget, TOperand1>(network, targetField, operand1Field, this.calcFn)
    }
}

export class Calculator2OpFactory<TTarget, TOperand1, TOperand2> extends AnyCalculatorFactory {
    targetId: FieldID
    operand1Id: FieldID
    operand2Id: FieldID

    calcFn: (operand1: TOperand1, operand2: TOperand2) => TTarget

    constructor(targetId: FieldID, operand1Id: FieldID, operand2Id: FieldID, calcFn: (operand1: TOperand1, operand2: TOperand2) => TTarget) {
        super()
        this.targetId = targetId
        this.operand1Id = operand1Id
        this.operand2Id = operand2Id
        this.calcFn = calcFn
    }

    public static registerFactory<TTarget, TOperand1, TOperand2>(targetId: FieldID, operand1Id: FieldID, operand2Id: FieldID, calcFn: (operand1: TOperand1, operand2: TOperand2) => TTarget): void {
        new Calculator2OpFactory<TTarget, TOperand1, TOperand2>(targetId, operand1Id, operand2Id, calcFn)
    }

    makeOrphanCalculator(network: BicycleNetwork): (AnyCalculator | undefined) {
        let targetField = network.getField(this.targetId) as Field<TTarget>
        let operand1Field = network.getField(this.operand1Id) as Field<TOperand1>
        let operand2Field = network.getField(this.operand2Id) as Field<TOperand2>
        if (targetField == undefined || operand1Field == undefined || operand2Field == undefined) {
            return undefined
        }
        
        return new Calculator2Op<TTarget, TOperand1, TOperand2>(network, targetField, operand1Field, operand2Field, this.calcFn)
    }
}

