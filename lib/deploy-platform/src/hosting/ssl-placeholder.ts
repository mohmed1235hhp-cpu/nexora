export interface SslCertRef { readonly projectId: string; readonly issued: boolean; readonly issuer: string; }
export class SslPlaceholder {
  private certs = new Map<string, SslCertRef>();
  request(projectId: string): SslCertRef {
    const cert: SslCertRef = { projectId, issued: false, issuer: 'placeholder-ca' };
    this.certs.set(projectId, cert);
    return cert;
  }
  get(projectId: string) { return this.certs.get(projectId); }
}
