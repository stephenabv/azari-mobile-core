export type { CalculatorSeed } from '../../navigation/types';
import type { TalkInquiryType } from '../../domain/talk/TalkInquiry';

export interface TalkInquiryParams {
  inquiryType?: TalkInquiryType;
}
