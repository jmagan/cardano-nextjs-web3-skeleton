import { Alert, Box } from "@chakra-ui/react";

export function FeedbackAlert({
  errorMessage,
  infoMessage
}: {
  errorMessage: string[];
  infoMessage?: string[];
}) {
  return (
    <>
      {errorMessage.length > 0 && (
        <Alert status="error" m="4" borderRadius="lg">
          {errorMessage.map((error, index) => {
            return (
              <Box key={index}>
                {error} <br />
              </Box>
            );
          })}
        </Alert>
      )}
      {infoMessage && infoMessage.length > 0 && (
        <Alert status="info" m="4" borderRadius="lg">
          {infoMessage.map((info, index) => {
            return (
              <Box key={index}>
                {info} <br />
              </Box>
            );
          })}
        </Alert>
      )}
    </>
  );
}
