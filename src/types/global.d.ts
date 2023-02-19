declare global {
  namespace globalThis {
    var mongoose: {
      conn: any;
      promise: any;
    };
  }
}

export default global;
