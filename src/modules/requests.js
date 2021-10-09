export default class Requests {
    constructor() {
      this.sessionId = '';
      this.serverError = false;
    }
  
    async getAsync(uri) {
      try {
        const data = await fetch(uri, {
          method: 'GET',
          headers: new Headers({
            '__ravenSession': this.sessionId
          })
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
  