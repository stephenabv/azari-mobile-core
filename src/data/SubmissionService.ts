import type { UploadFile } from '../core/http/RequestBody';
import { JsonBody, MultipartBody } from '../core/http/RequestBody';
import type { ProtectedApiClient } from '../core/security/ProtectedApiClient';
import {
  buildInquiryPayload,
  type InquiryForm,
} from '../domain/inquiry/PackageInquiry';
import type { PackageSelection } from '../domain/packages/PackageConfigurator';
import type { SolarPackage } from '../domain/packages/types';
import {
  buildQuotationPayload,
  type ProposalContext,
} from '../domain/quotation/ProposalRequest';
import { buildTalkPayload, type TalkForm } from '../domain/talk/TalkInquiry';
import { createdResponse } from './schemas';

/**
 * Customer submissions. Every call goes through the integrity-signed client,
 * so the server stores them exactly like website submissions.
 */
export class SubmissionService {
  constructor(private readonly client: ProtectedApiClient) {}

  async talkToExpert(form: TalkForm): Promise<void> {
    await this.client.request(
      {
        method: 'POST',
        path: '/api/talk/send',
        body: new JsonBody(buildTalkPayload(form)),
      },
      createdResponse,
    );
  }

  async packageInquiry(
    form: InquiryForm,
    pkg: SolarPackage,
    selection: PackageSelection | null,
  ): Promise<void> {
    await this.client.request(
      {
        method: 'POST',
        path: '/api/packages/inquiries',
        body: new JsonBody(buildInquiryPayload(form, pkg, selection)),
      },
      createdResponse,
    );
  }

  async proposal(
    context: Omit<ProposalContext, 'bill'>,
    bill: UploadFile | null,
  ): Promise<void> {
    const payload = buildQuotationPayload({ ...context, bill });
    await this.client.request(
      {
        method: 'POST',
        path: '/api/quotation/request-proposal',
        body: new MultipartBody(
          { payload: JSON.stringify(payload) },
          bill ? { billAttachment: bill } : {},
        ),
      },
      createdResponse,
    );
  }
}
