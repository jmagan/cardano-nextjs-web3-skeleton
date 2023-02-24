import { AxiosError } from "axios";
import { ApiResponse } from "@/types/api";

export function handleReactApiError(
  e: unknown,
  setErrorMessage: (messages: string[]) => void
) {
  if (e instanceof AxiosError) {
    const error = e as AxiosError<ApiResponse, any>;
    if (!e.response) {
      setErrorMessage(["NO_SERVER_RESPONSE"]);
    } else if (error.response && error.response.data?.message instanceof Array) {
      setErrorMessage(error.response.data?.message);
    } else if (
      error.response &&
      typeof error.response.data?.message === "string"
    ) {
      setErrorMessage([error.response.data.message]);
    } else {
      setErrorMessage(["UNKNOWN_ERROR"]);
    }
  } else if (e instanceof Error) {
    setErrorMessage([e.message]);
  } else {
    setErrorMessage(["UNKNOWN_ERROR"]);
  }
}
