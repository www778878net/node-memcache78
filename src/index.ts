const genericPool = require('generic-pool');
const Util = require('util');
const MemCache = require('memcached');
export default class MemCache78 {
    host: string;
    port: number;
    max: number;
    _pool: any;
    local: string;//根据地点划分
    /*
     * small
     *let  config={ }
     * 
     */
    constructor(config: any) {

        this.host = config["host"] || "127.0.0.1"; 
        this.port = config["port"] || 11211;
        this.max = config["max"] || 100;
        this.local = config["local"] || "";
 
        //用不了连接池 一用就报错
        //this.client=new MemCache(host+':'+port, {poolSize:500,reconnect:1000,retry:1000});
        let self = this;
     
        //this._pool = new Pool({
        this._pool = genericPool.createPool({
            create: function () {

                return new MemCache(self.host + ':' + self.port, {});

            },
            destroy: function (client) {

                if (client.connected) {
                    try {
                        client.end();
                    }
                    catch (err) {
                        console.log('Failed to memcached connection: ' + err);
                    }
                }
            }
        }, {
                max: self.max,
                min: 2,
                idleTimeoutMillis: 3000
            });

    }

    tbget(key: string, debug?: boolean): Promise<any> {
        debug = debug || false;
        var self = this;
        key += self.local;
        return new Promise((resolve, reject) => {
            self._pool.acquire().then(function (client) {

                client.get(key, function (err, reply) {
                    self._pool.release(client);
                    if (err) {
                        console.error('MemCache78 tbgettData Error: ' + Util.inspect(err));
                        reject(new Error(err));
                        return;
                    }
                    if (debug) {
                        console.log("memcache78 tbget:" + key + " value:" + reply);
                    }
                    //qq云没有返回undef
                    if (reply) {
                        try {
                            reply = JSON.parse(reply);
                        } catch (e) {
                            console.error('MemCache78 tbgettData jsonError: ' + Util.inspect(e) + reply);
                            self.del(key);
                        }
                    }

                    resolve(reply);
                });
            })


        }).catch((e) => {
            console.log(e);
        });

    };

    //方便 调试
    _getclient(): any {
        let self = this;
        return new MemCache(self.host + ':' + self.port, { poolSize: 2 });
    }

    incr(key: string, sec?: number, add?: number): any {
        sec = sec || 86400;
        add = add || 1;
        var self = this;

        return new Promise((resolve, reject) => {
            self._pool.acquire().then(function (client) {
                client.incr(key + self.local, add, (err, reply) => {
                    self._pool.release(client);
                    if (err == undefined) err = 0;
                    if (err) {
                        self.set(key, 1, sec);
                        reply = 1;
                        resolve(reply);
                        //reject(new Error(err));
                        //console.error(key + self.local+ 'MemCache78 increment Error: ' + err);
                    }
                    else {
                        //阿里云 qq云没有会返回false
                        if (!reply) {
                            self.set(key, 1, sec);
                            reply = 1;
                        }
                        resolve(reply);
                    }
                });
            });

        });



    };

    tbset(key: string, value: any, sec?: number): any {
        sec = sec || 86400;
        var self = this;
        key += self.local;
        return new Promise((resolve, reject) => {
            value = JSON.stringify(value);//可缓存表         
            self._pool.acquire().then(function (client) {
                client.set(key, value, sec, (err, reply) => {
                    self._pool.release(client);
                    if (err) {
                        reject(new Error(err));
                        console.error('MemCache78 Set Error: ' + err.val.toString());
                        return;
                    }
                    //这里返回值是空
                    resolve(reply);
                });
            })


        });
    };

    add(key: string, value: string | number, sec?: number): any {
        sec = sec || 86400;
      
        var self = this;
        key += self.local;
        return new Promise((resolve, reject) => {
            if (self.port === 0) {
                resolve(undefined);
                return;
            }
            //var client = self._getclient();
            self._pool.acquire().then(function (client) {
                client.add(key, value, sec, (err, reply) => {
                    self._pool.release(client);
                    if (err) {
                        resolve("");
                        //console.log('memcache add Error: ' + err + key + value);
                        return;
                    }
                    else
                        resolve(reply);
                });
            })
        });
    };



    del(key: string): any {
        let self = this;
        key += self.local;
        return new Promise((resolve, reject) => {
            if (this.port === 0) {
                resolve(undefined);
                return;
            }

            self._pool.acquire().then(function (client) {
                //var client = self._getclient();
                client.del(key, (err, reply) => {
                    self._pool.release(client);
                    if (err) {
                        resolve(undefined);
                        //def.reject(new Error(err));
                        console.error('memcache78 delData Error: ' + err);
                    }
                    else {
                        resolve(reply);
                    }
                });
            })
        });
    };



    set(key: string, value: string | number, sec?: number): any {
        sec = sec || 86400;
        
        var self = this;
        key += self.local;
        return new Promise((resolve, reject) => {
            if (this.port === 0) {
                resolve(undefined);
                return;
            }
        
            self._pool.acquire().then(function (client) {
            
                client.set(key, value, sec, (err, reply) => {
                    self._pool.release(client);
                  
                    if (err) {
                        reject(err);
                        console.error('memcache SetData Error: ' + err + key + value);
                        return;
                    }
                    //reply=true

                    resolve(reply);
                });
            })
        });
    };


    get(key: string, debug?: boolean): any {
        debug = debug || false;
        let self = this;
        key += self.local;
        return new Promise((resolve, reject) => {

            if (self.port === 0) {
                resolve(undefined);
                return;
            }

            //var client = self._getclient();

            self._pool.acquire().then(function (client) {
                client.get(key, (err, reply: string) => {
                    self._pool.release(client);
                    if (err) {
                        reject(err);
                        console.error('memcache GetData Error: ' + err + key);
                        return;
                    }
                    //qq云没有返回undef
                    //if (reply == undefined) reply = null;
                    //unde 和null都可以用!reply判断
                    if (debug) {
                        console.log("memcache78 get:" + key + " value:" + reply);
                    }
                    resolve(reply);
                });
            });

        });
    };
}