export default function (
  message: any, 
  responseCallback?: ((response: any) => void) | undefined
) {
  chrome.runtime.sendMessage(
    'mnojpmjdmbbfmejpflffifhffcmidifd',
    message,
    responseCallback
  )
}