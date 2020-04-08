import { FieldID } from "./field";

export class Relationship {
    
    fieldIDs: Set<FieldID> = new Set()

    public addSourceField(fieldID: FieldID): void {
        this.fieldIDs.add(fieldID)
    }
}