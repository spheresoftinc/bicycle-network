import { AnyField, Field, FieldCode } from "./field"
import { Relationship } from "./relationship"
import { BicycleNetwork } from "./bicycleNetwork"

export class AnyCalculator {

    network?: BicycleNetwork
    wasUsed: boolean = false

    constructor(network: BicycleNetwork) {
        this.network = network
    }

    setField(): boolean {
        return false
    }

    resetField(): void {
    }

    isReady(): boolean {
        return true
    }

    anyTarget(): AnyField {
        // This line is here for the compiler. If you get here, it's programmer error.
        return new AnyField()
    }

    makeRelationship(): Relationship {
        return new Relationship()
    }
}

export class Calculator<TTarget> extends AnyCalculator {
    target: Field<TTarget>

    constructor(network: BicycleNetwork, target: Field<TTarget>) {
        super(network)
        this.target = target
    }

    makeRelationship(): Relationship {
        let r = super.makeRelationship()
        r.addSourceField(this.target.id)
        return r
    }

    anyTarget(): AnyField {
        return this.target
    }

    calcTarget(): (TTarget | undefined) {
        // assertionFailure("Must be overridden")
        return undefined
    }

    setField(): boolean {
        // check to see if this calculator is ready.  Typically this means that all of the source
        // operands are not clear, but in some cases, the actual values of the fields may determine
        // if this calculator is ready (i.e. value-dependent calculators).
        if (!this.isReady()) {
            return true // not ready, but that's ok
        }

        if (this.network == undefined ) { return true }

        // check to see if an inversion of this calculator has already been used
        // if it has, we may not want to use it.
        let r = this.makeRelationship()
        if (this.network.relationshipWasUsed(r)) {
            return true
        }

        let result = this.calcTarget() 
        if (result == undefined) { 
            return true
        }

        // if the target is clear then propagate the result through the network
        if (this.target.code == FieldCode.clear) {
            // every calc that acts is added to the rollbacks, and will be reversed if the network
            // becomes inconsistent
            this.network.addRollback(this)

            // register the relationship
            this.network.addUsedRelationship(r)

            // Set the value with a calc code...
            return this.target.setValue(result, FieldCode.calced)
        } else {
            // Compare to existing value, to see if the sources are consistent with the target.
            return this.target.value() == result
        }
    }
}

export class Calculator1Op<TTarget, TOperand1> extends Calculator<TTarget> {

    operand1: Field<TOperand1>
    calcFn: (operand1: TOperand1) => TTarget
    readyFn?: (operand1: TOperand1) => boolean

    constructor(network: BicycleNetwork, target: Field<TTarget>, operand1: Field<TOperand1>, calcFn: (operand1: TOperand1) => TTarget, readyFn: (((operand1: TOperand1) => boolean)|undefined) = undefined) {
        super(network, target)
        this.operand1 = operand1
        this.calcFn = calcFn
        this.readyFn = readyFn        
        operand1.addDependent(this)
    }

    isReady(): boolean {
        if (this.operand1.code == FieldCode.clear) {
            return false
        }
        if (this.readyFn == undefined) {
            return true
        }
        return this.readyFn(this.operand1.value())
    }

    calcTarget(): (TTarget | undefined) {
        if (this.operand1.code == FieldCode.clear) {
            return undefined
        }
        return this.calcFn(this.operand1.value())
    }

    makeRelationship(): Relationship {
        let r = super.makeRelationship()
        r.addSourceField(this.operand1.id)
        return r
    }
}


export class Calculator2Op<TTarget, TOperand1, TOperand2> extends Calculator<TTarget> {

    operand1: Field<TOperand1>
    operand2: Field<TOperand2>
    calcFn: (operand1: TOperand1, operand2: TOperand2) => TTarget
    readyFn?: (operand1: TOperand1, operand2: TOperand2) => boolean

    constructor(network: BicycleNetwork, target: Field<TTarget>, operand1: Field<TOperand1>, operand2: Field<TOperand2>, calcFn: (operand1: TOperand1, operand2: TOperand2) => TTarget, readyFn: (((operand1: TOperand1, operand2: TOperand2) => boolean)|undefined) = undefined) {
        super(network, target)
        this.operand1 = operand1
        this.operand2 = operand2
        this.calcFn = calcFn
        this.readyFn = readyFn        
        operand1.addDependent(this)
        operand2.addDependent(this)
    }

    isReady(): boolean {
        if (this.operand1.code == FieldCode.clear) {
            return false
        }
        if (this.operand2.code == FieldCode.clear) {
            return false
        }
        if (this.readyFn == undefined) {
            return true
        }
        return this.readyFn(this.operand1.value(), this.operand2.value())
    }

    calcTarget(): (TTarget | undefined) {
        if (this.operand1.code == FieldCode.clear) {
            return undefined
        }
        if (this.operand2.code == FieldCode.clear) {
            return undefined
        }
        return this.calcFn(this.operand1.value(), this.operand2.value())
    }

    makeRelationship(): Relationship {
        let r = super.makeRelationship()
        r.addSourceField(this.operand1.id)
        r.addSourceField(this.operand2.id)
        return r
    }
}