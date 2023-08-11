export type VoiceTranscript = {
    words: VoiceTranscript[];
    text: string;
    type: TranscriptType;
    confidence: number;
}

export enum TranscriptType {
    PartialTranscript = 'PartialTranscript',
    FinalTranscript = 'FinalTranscript'
}