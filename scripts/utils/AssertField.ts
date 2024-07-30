export interface AssertField {
    (condition: boolean, field: string, message: string, value?: string): void;
}
