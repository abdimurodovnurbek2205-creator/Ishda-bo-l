import { storeService } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial live state immediately
      const initialSummary = storeService.getLiveSummary();
      controller.enqueue(
        encoder.encode(`event: update\ndata: ${JSON.stringify(initialSummary)}\n\n`)
      );

      // Heartbeat interval every 4 seconds to stream latest employee coordinates and statuses
      const interval = setInterval(() => {
        try {
          const summary = storeService.getLiveSummary();
          controller.enqueue(
            encoder.encode(`event: update\ndata: ${JSON.stringify(summary)}\n\n`)
          );
        } catch (e) {
          clearInterval(interval);
          controller.close();
        }
      }, 4000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
