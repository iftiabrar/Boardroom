import { SetMetadata } from "@nestjs/common";

export const RESPONSE_MESSAGE_KEY = "responseMessage";
export const ResponseMessage = (m: string) => SetMetadata(RESPONSE_MESSAGE_KEY, m);
