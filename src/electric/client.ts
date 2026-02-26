export type ElectricClient = {
  app: string;
  url: string;
  connected: boolean;
};

let clientPromise: Promise<ElectricClient> | null = null;

export function getElectricClient(): Promise<ElectricClient> {
  if (!clientPromise) {
    clientPromise = Promise.resolve({
      app: 'project-epione-graph',
      url: 'http://localhost:5133',
      connected: true
    });
  }

  return clientPromise;
}
