export type Terms = {
    termId: string;
    typeName: string;
    required: boolean;
    content: string;
    clause: number;
    effectivityStartAt: string;
    effectivityEndAt: string | null
}