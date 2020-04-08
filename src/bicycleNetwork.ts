import { AnySetter } from "./setter";
import { AnyCalculator } from "./calculator";
import { AnyField, FieldCode, Field, FieldID } from "./field";
import { Relationship } from "./relationship";

export class BicycleNetwork {

    public fields: Set<AnyField> = new Set()
    calculators: Set<AnyCalculator> = new Set()
    setters: AnySetter[] = []

    rollbackCalculators: Set<AnyCalculator> = new Set()
    usedRelationships: Set<Relationship> = new Set()

    public autoCalc: boolean = true
    numSettersInserted: number = 0

    public constructor() {
    }

    // General

    doAutoCalc(): void {
        if (this.autoCalc) {
            this.setFields()    
        }
    }

    // Rollbacks

    addRollback(calculator: AnyCalculator): void {
        this.rollbackCalculators.add(calculator)
    }

    rollbackUsedRelationship(relationship: Relationship): void {
        this.usedRelationships.delete(relationship)
    }

    markRollbackCalculatorsAsUsed(): void {
        this.rollbackCalculators.forEach(function(c) {
            c.wasUsed = true
        })
    }

    // Used Relationships
    
    addUsedRelationship(relationship: Relationship): void {
        this.usedRelationships.add(relationship)
    }

    relationshipWasUsed(relationship: Relationship): boolean {
        return this.usedRelationships.has(relationship)
    }

    clearUsedRelationships(): void {
        this.usedRelationships = new Set()
    }

    // Fields

    adoptField(field: AnyField): void {
        this.fields.add(field)
        field.network = this
    }

    dropField(field: AnyField): void {
        this.fields.delete(field)
    }

    clearFields(): void {
        this.fields.forEach(function (f) {
            f.code = FieldCode.clear
        })
    }

    getField(id: FieldID): (AnyField | undefined) {
        for (let field of this.fields) {
            if (field.id == id) {
                return field
            }
        }
        return undefined
    }

    public connectCalculators(): void {
        for (let factory of AnyField.calculatorFactories) {
            let calculator = factory.makeOrphanCalculator(this)
            if (calculator != undefined) {
                this.adoptCalculator(calculator)
            }
        }
    }

    adoptCalculator(calculator: AnyCalculator): void {
        this.calculators.add(calculator)
    }

    dropCalculator(calculator: AnyCalculator): void {
        this.calculators.delete(calculator)
    }

    clearCalculators(): void {
        this.calculators.forEach(function(c) { c.wasUsed = false })
    }

    resetCalcCountPerField(): void {
        this.fields.forEach(function(f) { f.zeroNumTargettingCalculators() })
    }

    countCalcsPerField(): void {
        this.resetCalcCountPerField()
        this.calculators.forEach(function(c) { c.anyTarget().incrementNumTargettingCalculators()})
    }

    // Setters

    public adoptSetter(setter: AnySetter): void {
        setter.network = this
        setter.insertOrder = this.numSettersInserted++
        let ac = this.autoCalc
        this.autoCalc = false

        if (setter.isUserProvided()) {
            this.dropUserProvidedSetters(setter.anyTarget())
        }

        this.setters.push(setter)
        this.autoCalc = ac
        this.doAutoCalc()
    }

    dropASetter(field: AnyField): boolean {
        for (let i = 0; i < this.setters.length; ++i) {
            let setter = this.setters[i]
            if (setter.isMatch(field)) {
                this.setters.splice(i, 1)
                setter.network = undefined
                return true
            }
        }
        return false
    }

    dropSetter(setter: AnySetter): void {
        let setterIndex = this.setters.indexOf(setter)
        if (setterIndex >= 0) {
            this.setters.splice(setterIndex, 1)
            setter.network = undefined
        }
    }

    dropSetters(field: AnyField): void {
        while (this.dropASetter(field)) {
            // do nothing
        }
        this.doAutoCalc()
    }

    public setFields(): void {
        // TODO: call willCalc function
        this.clearFields()
        this.clearUsedRelationships()
        this.clearCalculators()
        this.countCalcsPerField()
        this.sortSetters()

        let len = this.setters.length
        let i = 0
        while (i < len) {
            for (i = 0; i < len; ++i) {
                this.rollbackCalculators = new Set()
                
                if (this.setters[i].setField()) {
                    // If the setter was successful, mark the list of rollback calculators as used
                    // this way we can not use others in the same relationship
                    this.markRollbackCalculatorsAsUsed()
                    // break out of this loop so that we can retry old setters that failed
                    break
                } else {
                    // if the setter was not successful, undo the effects of all the calculators
                    this.rollback()
                }
            }
        }
        // TODO: call didCalc function
    }

    sortSetters(): void {
        if (this.setters.length < 2) {
            return
        }

        var done = false
        while (!done) {
            done = true
            for (let i = 0; i < this.setters.length - 1; ++i) {
                if (this.setters[i+1].lessThan(this.setters[i])) {
                    // swap thme
                    let temp = this.setters[i]
                    this.setters[i] = this.setters[i+1]
                    this.setters[i+1] = temp
                    done = false
                }
            }
        }
    }

    rollback(): void {
        let network = this
        this.rollbackCalculators.forEach (function(rollback) {
            rollback.resetField()
            rollback.wasUsed = false
            let r = rollback.makeRelationship()
            network.rollbackUsedRelationship(r)
        })
    }

    dropUserProvidedSetters(field: AnyField): void {
        // Go backwards because we intend to remove setters
        for (let i = this.setters.length; i > 0; --i) {
            let setterIndex = i - 1
            let setter = this.setters[setterIndex]
            if (setter.isUserProvided() && setter.isMatch(field)) {
                this.setters.splice(setterIndex, 1)
            }
        }
    }
}