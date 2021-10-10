export default class Requests {
    constructor() {
      this.sessionId = '';
      this.serverError = false;
      this.headers = {};
    }

    setSessionId(sessionId) {
        this.sessionId = sessionId;
        this.headers = {'__ravenSession':sessionId};
    }
  
    async getAsync(uri) {
      try {
        const data = await fetch(uri, {
          method: 'GET',
          headers: new Headers(this.headers)
        });
        const json = data.json();
        this.serverError = false;
        return json;
      } catch (err) {
        this.serverError = true;
        return null;
      }
    }
  }
  