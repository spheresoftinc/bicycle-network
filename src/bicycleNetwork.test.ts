import { BicycleNetwork } from "./bicycleNetwork";
import { Field, FieldCode } from "./field";
import { Calculator1OpFactory, Calculator2OpFactory } from "./calculatorFactory";
import { SetterConstant } from "./setter";

test('simple', () => {
        let network = new BicycleNetwork()
        let f = new Field<number>()
        network.adoptField(f)
        expect(f.code).toBe(FieldCode.clear)
});


test('1 op', () => {
    let network = new BicycleNetwork()
    let feet = new Field<number>()
    network.adoptField(feet)
    
    let inches = new Field<number>()
    network.adoptField(inches)

    Calculator1OpFactory.registerFactory<number, number>(inches.id, feet.id, function(i) { return i * 12.0 })
    Calculator1OpFactory.registerFactory<number, number>(feet.id, inches.id, function(i) { return i / 12.0 })

    network.connectCalculators()

    let setter = new SetterConstant<number>(feet, 3.0)
    network.adoptSetter(setter)

    expect(feet.code).toBe(FieldCode.set)
    expect(feet.value()).toBe(3.0)

    expect(inches.code).toBe(FieldCode.calced)
    expect(inches.value()).toBe(36.0)

    let setter2 = new SetterConstant<number>(inches, 12.0)
    network.adoptSetter(setter2)

    expect(feet.code).toBe(FieldCode.calced)
    expect(feet.value()).toBe(1.0)

    expect(inches.code).toBe(FieldCode.set)
    expect(inches.value()).toBe(12.0)
});


test('2 op', () => {
    let network = new BicycleNetwork()
    
    let num1 = new Field<number>()
    network.adoptField(num1)
    
    let num2 = new Field<number>()
    network.adoptField(num2)

    let sum = new Field<number>()
    network.adoptField(sum)

    Calculator2OpFactory.registerFactory<number, number, number>(sum.id, num1.id, num2.id, function(n1, n2) { return n1 + n2 })
    Calculator2OpFactory.registerFactory<number, number, number>(num1.id, sum.id, num2.id, function(sum, n2) { return sum - n2 })
    Calculator2OpFactory.registerFactory<number, number, number>(num2.id, sum.id, num1.id, function(sum, n1) { return sum - n1 })

    network.connectCalculators()

    network.adoptSetter(new SetterConstant<number>(num1, 3.0))
    network.adoptSetter(new SetterConstant<number>(num2, 4.0))

    expect(num1.code).toBe(FieldCode.set)
    expect(num1.value()).toBe(3.0)

    expect(num2.code).toBe(FieldCode.set)
    expect(num2.value()).toBe(4.0)

    expect(sum.code).toBe(FieldCode.calced)
    expect(sum.value()).toBe(7.0)

    network.adoptSetter(new SetterConstant<number>(sum, 12.0))
    expect(num1.code).toBe(FieldCode.calced)
    expect(num1.value()).toBe(8.0)

    expect(num2.code).toBe(FieldCode.set)
    expect(num2.value()).toBe(4.0)

    expect(sum.code).toBe(FieldCode.set)
    expect(sum.value()).toBe(12.0)
});