export class ReorderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ReorderError';
    }
}
