
export class Money {
  constructor(private readonly amount: number) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }

    if (Math.round(amount * 100) !== amount * 100) {
      throw new Error('Money must have at most 2 decimal places');
    }
  }

  getValue(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return new Money(this.amount - other.amount);
  }

  multiply(multiplier: number): Money {
    const result = this.amount * multiplier;
    return new Money(Math.round(result * 100) / 100);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }
}