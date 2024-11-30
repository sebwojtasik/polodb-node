"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// binding.js
var require_binding = __commonJS({
  "binding.js"(exports2, module2) {
    "use strict";
    var { existsSync, readFileSync } = require("fs");
    var { join } = require("path");
    var { platform, arch } = process;
    var nativeBinding = null;
    var localFileExisted = false;
    var loadError = null;
    function isMusl() {
      if (!process.report || typeof process.report.getReport !== "function") {
        try {
          const lddPath = require("child_process").execSync("which ldd").toString().trim();
          return readFileSync(lddPath, "utf8").includes("musl");
        } catch (e) {
          return true;
        }
      } else {
        const { glibcVersionRuntime } = process.report.getReport().header;
        return !glibcVersionRuntime;
      }
    }
    switch (platform) {
      case "android":
        switch (arch) {
          case "arm64":
            localFileExisted = existsSync(join(__dirname, "polodb.android-arm64.node"));
            try {
              if (localFileExisted) {
                nativeBinding = require("./polodb.android-arm64.node");
              } else {
                nativeBinding = require("@sebwojtasik/polodb-android-arm64");
              }
            } catch (e) {
              loadError = e;
            }
            break;
          case "arm":
            localFileExisted = existsSync(join(__dirname, "polodb.android-arm-eabi.node"));
            try {
              if (localFileExisted) {
                nativeBinding = require("./polodb.android-arm-eabi.node");
              } else {
                nativeBinding = require("@sebwojtasik/polodb-android-arm-eabi");
              }
            } catch (e) {
              loadError = e;
            }
            break;
          default:
            throw new Error(`Unsupported architecture on Android ${arch}`);
        }
        break;
      case "win32":
        switch (arch) {
          case "x64":
            localFileExisted = existsSync(
              join(__dirname, "polodb.win32-x64-msvc.node")
            );
            try {
              if (localFileExisted) {
                nativeBinding = require("./polodb.win32-x64-msvc.node");
              } else {
                nativeBinding = require("@sebwojtasik/polodb-win32-x64-msvc");
              }
            } catch (e) {
              loadError = e;
            }
            break;
          case "ia32":
            localFileExisted = existsSync(
              join(__dirname, "polodb.win32-ia32-msvc.node")
            );
            try {
              if (localFileExisted) {
                nativeBinding = require("./polodb.win32-ia32-msvc.node");
              } else {
                nativeBinding = require("@sebwojtasik/polodb-win32-ia32-msvc");
              }
            } catch (e) {
              loadError = e;
            }
            break;
          case "arm64":
            localFileExisted = existsSync(
              join(__dirname, "polodb.win32-arm64-msvc.node")
            );
            try {
              if (localFileExisted) {
                nativeBinding = require("./polodb.win32-arm64-msvc.node");
              } else {
                nativeBinding = require("@sebwojtasik/polodb-win32-arm64-msvc");
              }
            } catch (e) {
              loadError = e;
            }
            break;
          default:
            throw new Error(`Unsupported architecture on Windows: ${arch}`);
        }
        break;
      case "darwin":
        localFileExisted = existsSync(join(__dirname, "polodb.darwin-universal.node"));
        try {
          if (localFileExisted) {
            nativeBinding = require("./polodb.darwin-universal.node");
          } else {
            nativeBinding = require("@sebwojtasik/polodb-darwin-universal");
          }
          break;
        } catch {
        }
        switch (arch) {
          case "x64":
            localFileExisted = existsSync(join(__dirname, "polodb.darwin-x64.node"));
            try {
              if (localFileExisted) {
                nativeBinding = require("./polodb.darwin-x64.node");
              } else {
                nativeBinding = require("@sebwojtasik/polodb-darwin-x64");
              }
            } catch (e) {
              loadError = e;
            }
            break;
          case "arm64":
            localFileExisted = existsSync(
              join(__dirname, "polodb.darwin-arm64.node")
            );
            try {
              if (localFileExisted) {
                nativeBinding = require("./polodb.darwin-arm64.node");
              } else {
                nativeBinding = require("@sebwojtasik/polodb-darwin-arm64");
              }
            } catch (e) {
              loadError = e;
            }
            break;
          default:
            throw new Error(`Unsupported architecture on macOS: ${arch}`);
        }
        break;
      case "freebsd":
        if (arch !== "x64") {
          throw new Error(`Unsupported architecture on FreeBSD: ${arch}`);
        }
        localFileExisted = existsSync(join(__dirname, "polodb.freebsd-x64.node"));
        try {
          if (localFileExisted) {
            nativeBinding = require("./polodb.freebsd-x64.node");
          } else {
            nativeBinding = require("@sebwojtasik/polodb-freebsd-x64");
          }
        } catch (e) {
          loadError = e;
        }
        break;
      case "linux":
        switch (arch) {
          case "x64":
            if (isMusl()) {
              localFileExisted = existsSync(
                join(__dirname, "polodb.linux-x64-musl.node")
              );
              try {
                if (localFileExisted) {
                  nativeBinding = require("./polodb.linux-x64-musl.node");
                } else {
                  nativeBinding = require("@sebwojtasik/polodb-linux-x64-musl");
                }
              } catch (e) {
                loadError = e;
              }
            } else {
              localFileExisted = existsSync(
                join(__dirname, "polodb.linux-x64-gnu.node")
              );
              try {
                if (localFileExisted) {
                  nativeBinding = require("./polodb.linux-x64-gnu.node");
                } else {
                  nativeBinding = require("@sebwojtasik/polodb-linux-x64-gnu");
                }
              } catch (e) {
                loadError = e;
              }
            }
            break;
          case "arm64":
            if (isMusl()) {
              localFileExisted = existsSync(
                join(__dirname, "polodb.linux-arm64-musl.node")
              );
              try {
                if (localFileExisted) {
                  nativeBinding = require("./polodb.linux-arm64-musl.node");
                } else {
                  nativeBinding = require("@sebwojtasik/polodb-linux-arm64-musl");
                }
              } catch (e) {
                loadError = e;
              }
            } else {
              localFileExisted = existsSync(
                join(__dirname, "polodb.linux-arm64-gnu.node")
              );
              try {
                if (localFileExisted) {
                  nativeBinding = require("./polodb.linux-arm64-gnu.node");
                } else {
                  nativeBinding = require("@sebwojtasik/polodb-linux-arm64-gnu");
                }
              } catch (e) {
                loadError = e;
              }
            }
            break;
          case "arm":
            if (isMusl()) {
              localFileExisted = existsSync(
                join(__dirname, "polodb.linux-arm-musleabihf.node")
              );
              try {
                if (localFileExisted) {
                  nativeBinding = require("./polodb.linux-arm-musleabihf.node");
                } else {
                  nativeBinding = require("@sebwojtasik/polodb-linux-arm-musleabihf");
                }
              } catch (e) {
                loadError = e;
              }
            } else {
              localFileExisted = existsSync(
                join(__dirname, "polodb.linux-arm-gnueabihf.node")
              );
              try {
                if (localFileExisted) {
                  nativeBinding = require("./polodb.linux-arm-gnueabihf.node");
                } else {
                  nativeBinding = require("@sebwojtasik/polodb-linux-arm-gnueabihf");
                }
              } catch (e) {
                loadError = e;
              }
            }
            break;
          case "riscv64":
            if (isMusl()) {
              localFileExisted = existsSync(
                join(__dirname, "polodb.linux-riscv64-musl.node")
              );
              try {
                if (localFileExisted) {
                  nativeBinding = require("./polodb.linux-riscv64-musl.node");
                } else {
                  nativeBinding = require("@sebwojtasik/polodb-linux-riscv64-musl");
                }
              } catch (e) {
                loadError = e;
              }
            } else {
              localFileExisted = existsSync(
                join(__dirname, "polodb.linux-riscv64-gnu.node")
              );
              try {
                if (localFileExisted) {
                  nativeBinding = require("./polodb.linux-riscv64-gnu.node");
                } else {
                  nativeBinding = require("@sebwojtasik/polodb-linux-riscv64-gnu");
                }
              } catch (e) {
                loadError = e;
              }
            }
            break;
          case "s390x":
            localFileExisted = existsSync(
              join(__dirname, "polodb.linux-s390x-gnu.node")
            );
            try {
              if (localFileExisted) {
                nativeBinding = require("./polodb.linux-s390x-gnu.node");
              } else {
                nativeBinding = require("@sebwojtasik/polodb-linux-s390x-gnu");
              }
            } catch (e) {
              loadError = e;
            }
            break;
          default:
            throw new Error(`Unsupported architecture on Linux: ${arch}`);
        }
        break;
      default:
        throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`);
    }
    if (!nativeBinding) {
      if (loadError) {
        throw loadError;
      }
      throw new Error(`Failed to load native binding`);
    }
    var { InternalPoloDbClient: InternalPoloDbClient2, InternalPoloDbCollection, InternalPoloDbCursor } = nativeBinding;
    module2.exports.InternalPoloDbClient = InternalPoloDbClient2;
    module2.exports.InternalPoloDbCollection = InternalPoloDbCollection;
    module2.exports.InternalPoloDbCursor = InternalPoloDbCursor;
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  PoloDbClient: () => PoloDbClient,
  PoloDbCollection: () => PoloDbCollection
});
module.exports = __toCommonJS(src_exports);
var import_binding = __toESM(require_binding());

// src/bson.ts
var import_bson = require("bson");
var objToBsonHex = (obj) => Buffer.from(import_bson.BSON.serialize(obj)).toString("hex");
var bsonHexToObj = (hex) => import_bson.BSON.deserialize(Buffer.from(hex, "hex"));

// src/index.ts
var PoloDbClient = class {
  client;
  constructor(path) {
    this.client = new import_binding.InternalPoloDbClient(path);
  }
  collection(name) {
    return new PoloDbCollection(this.client, name);
  }
};
var PoloDbCollection = class {
  collection;
  constructor(client, name) {
    this.collection = client.collection(name);
  }
  insertOne(doc) {
    return new Promise((resolve, reject) => {
      this.collection.insertOne(objToBsonHex(doc), (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(bsonHexToObj(result));
        }
      });
    });
  }
  insertMany(docs) {
    return new Promise((resolve, reject) => {
      this.collection.insertMany(
        docs.map((doc) => objToBsonHex(doc)),
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(bsonHexToObj(result));
          }
        }
      );
    });
  }
  findOne(filter) {
    return new Promise((resolve, reject) => {
      this.collection.findOne(objToBsonHex(filter), (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result ? bsonHexToObj(result) : null);
        }
      });
    });
  }
  find(filter) {
    const cursor = this.collection.find(objToBsonHex(filter));
    return new PoloDbCursor(cursor);
  }
  updateOne(filter, update) {
    return new Promise((resolve, reject) => {
      this.collection.updateOne(objToBsonHex(filter), objToBsonHex(update), (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(bsonHexToObj(result));
        }
      });
    });
  }
  updateMany(filter, update) {
    return new Promise((resolve, reject) => {
      this.collection.updateOne(objToBsonHex(filter), objToBsonHex(update), (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(bsonHexToObj(result));
        }
      });
    });
  }
  deleteOne(filter) {
    return new Promise((resolve, reject) => {
      this.collection.deleteOne(objToBsonHex(filter), (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(bsonHexToObj(result));
        }
      });
    });
  }
  deleteMany(filter) {
    return new Promise((resolve, reject) => {
      this.collection.deleteMany(objToBsonHex(filter), (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(bsonHexToObj(result));
        }
      });
    });
  }
};
var PoloDbCursor = class {
  cursor;
  constructor(cursor) {
    this.cursor = cursor;
  }
  limit(limit) {
    this.cursor.limit(limit);
    return this;
  }
  skip(skip) {
    this.cursor.skip(skip);
    return this;
  }
  sort(sort) {
    this.cursor.sort(objToBsonHex(sort));
    return this;
  }
  toArray() {
    return new Promise((resolve, reject) => {
      this.cursor.toArray((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(bsonHexToObj(result).results);
        }
      });
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PoloDbClient,
  PoloDbCollection
});
