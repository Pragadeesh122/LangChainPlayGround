import {CheerioCrawler, Dataset} from "crawlee";

export async function crawlWebsite(startUrl: string): Promise<string[]> {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 50, // Limit the number of pages to crawl
    async requestHandler({$, request}) {
      const data = $("body").text(); // Extract text from the body
      await Dataset.pushData({
        url: request.url,
        text: data,
      });
    },
  });

  await crawler.run([startUrl]);
  const dataset = await Dataset.open();
  const items = await dataset.getData();
  return items.items.map((item) => item.text as string);
}
