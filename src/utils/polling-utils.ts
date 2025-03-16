
import { paths } from '@/config/api-paths';
import { fetchResponseData } from './api-utils';
import { API_BASE_URL } from './api-utils';

export async function pollMessageStatus(
  requestId: string,
  onStatusUpdate: (stage: string) => void,
  onComplete: (responseData: any) => void,
  onError: (error: Error) => void,
  maxPollTime = 120000,
  pollInterval = 1500
) {
  let timeoutId: NodeJS.Timeout;
  let intervalId: NodeJS.Timeout;
  
  const stopPolling = () => {
    clearTimeout(timeoutId);
    clearInterval(intervalId);
  };
  
  try {
    // Set a maximum polling time
    timeoutId = setTimeout(() => {
      stopPolling();
      onError(new Error('Polling timed out after ' + maxPollTime + 'ms'));
    }, maxPollTime);
    
    // Start polling
    intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${paths.CHAT_STATUS_API}/${requestId}`);
        
        if (!response.ok) {
          stopPolling();
          throw new Error('Failed to poll message status');
        }
        
        const data = await response.json();
        
        if (data.status === 'processing') {
          onStatusUpdate(data.stage || 'Processing...');
        } else if (data.status === 'complete') {
          stopPolling();
          
          const responseData = await fetchResponseData(requestId);
          onComplete(responseData);
        }
      } catch (error) {
        stopPolling();
        onError(error instanceof Error ? error : new Error('Unknown error during polling'));
      }
    }, pollInterval);
    
    // Return a function to stop polling
    return stopPolling;
  } catch (error) {
    stopPolling();
    onError(error instanceof Error ? error : new Error('Failed to start polling'));
    return () => {};
  }
}
