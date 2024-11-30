#![deny(clippy::all)]

mod document;

use napi::bindgen_prelude::*;
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi::{Error, Result};
use napi_derive::napi;
use polodb_core::{bson::doc, bson::Bson, bson::Document, CollectionT, Database};
use std::path::Path;
use std::sync::Arc;
use std::sync::Mutex;

fn map_polo_error(e: polodb_core::Error) -> Error {
  Error::from_reason(e.to_string())
}

#[napi]
pub struct InternalPoloDbClient {
  inner: Arc<Mutex<Database>>,
}

#[napi]
pub struct InternalPoloDbCollection {
  inner: Arc<polodb_core::Collection<Document>>,
  _db: Arc<Mutex<Database>>,
}

#[napi]
pub struct InternalPoloDbCursor {
  filter: Document,
  collection: Arc<polodb_core::Collection<Document>>,
  _db: Arc<Mutex<Database>>,
  skip: Option<u64>,
  limit: Option<u64>,
  sort: Option<Document>,
}

#[napi]
impl InternalPoloDbClient {
  #[napi(constructor)]
  pub fn new(path: String) -> Result<Self> {
    let db: Database = Database::open_path(Path::new(&path)).map_err(map_polo_error)?;
    Ok(InternalPoloDbClient {
      inner: Arc::new(Mutex::new(db)),
    })
  }

  #[napi]
  pub fn collection(&self, name: String) -> Result<InternalPoloDbCollection> {
    let db_guard = self
      .inner
      .lock()
      .map_err(|e| Error::from_reason(e.to_string()))?;
    let collection: polodb_core::Collection<Document> = db_guard.collection(&name);
    Ok(InternalPoloDbCollection {
      inner: Arc::new(collection),
      _db: Arc::clone(&self.inner),
    })
  }
}

#[napi]
impl InternalPoloDbCollection {
  #[napi(ts_args_type = "doc: string, callback: (err: null | Error, result: string) => void")]
  pub fn insert_one(&self, doc: String, callback: JsFunction) -> Result<()> {
    let inner = Arc::clone(&self.inner);
    let db = Arc::clone(&self._db);

    let tsfn: ThreadsafeFunction<String> =
      callback.create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;

    std::thread::spawn(move || {
      if db.lock().is_err() {
        tsfn.call(
          Err(Error::from_reason("Database connection is closed")),
          ThreadsafeFunctionCallMode::Blocking,
        );
        return;
      }

      let doc = match document::hex_to_bson(doc) {
        Ok(d) => d,
        Err(e) => {
          tsfn.call(Err(e), ThreadsafeFunctionCallMode::Blocking);
          return;
        }
      };

      match inner.insert_one(doc) {
        Ok(result) => {
          let response = document::bson_to_hex(&doc! {
              "inserted_id": result.inserted_id
          });
          tsfn.call(Ok(response), ThreadsafeFunctionCallMode::Blocking);
        }
        Err(e) => {
          tsfn.call(
            Err(Error::from_reason(e.to_string())),
            ThreadsafeFunctionCallMode::Blocking,
          );
        }
      }
    });

    Ok(())
  }

  #[napi(ts_args_type = "docs: string[], callback: (err: null | Error, result: string) => void")]
  pub fn insert_many(&self, docs: Array, callback: JsFunction) -> Result<()> {
    let inner = Arc::clone(&self.inner);
    let db = Arc::clone(&self._db);

    let tsfn: ThreadsafeFunction<String> =
      callback.create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;

    let mut documents = Vec::new();
    for i in 0..docs.len() {
      if let Some(obj) = docs.get::<String>(i)? {
        match document::hex_to_bson(obj) {
          Ok(doc) => documents.push(doc),
          Err(e) => {
            tsfn.call(Err(e), ThreadsafeFunctionCallMode::Blocking);
            return Ok(());
          }
        }
      }
    }

    std::thread::spawn(move || {
      if db.lock().is_err() {
        tsfn.call(
          Err(Error::from_reason("Database connection is closed")),
          ThreadsafeFunctionCallMode::Blocking,
        );
        return;
      }

      match inner.insert_many(documents) {
        Ok(result) => {
          let response = document::bson_to_hex(&doc! {
              "inserted_ids": result.inserted_ids.values().cloned().collect::<Vec<Bson>>()
          });
          tsfn.call(Ok(response), ThreadsafeFunctionCallMode::Blocking);
        }
        Err(e) => {
          tsfn.call(
            Err(Error::from_reason(e.to_string())),
            ThreadsafeFunctionCallMode::Blocking,
          );
        }
      }
    });

    Ok(())
  }

  #[napi(
    ts_args_type = "filter: string, callback: (err: null | Error, result: string | null) => void"
  )]
  pub fn find_one(&self, filter: String, callback: JsFunction) -> Result<()> {
    let inner = Arc::clone(&self.inner);
    let db = Arc::clone(&self._db);

    let tsfn: ThreadsafeFunction<Option<String>> =
      callback.create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;

    let filter_doc = match document::hex_to_bson(filter) {
      Ok(d) => d,
      Err(e) => {
        tsfn.call(Err(e), ThreadsafeFunctionCallMode::Blocking);
        return Ok(());
      }
    };

    std::thread::spawn(move || {
      if db.lock().is_err() {
        tsfn.call(
          Err(Error::from_reason("Database connection is closed")),
          ThreadsafeFunctionCallMode::Blocking,
        );
        return;
      }

      match inner.find_one(filter_doc) {
        Ok(result) => {
          let response = result.map(|doc| document::bson_to_hex(&doc));
          tsfn.call(Ok(response), ThreadsafeFunctionCallMode::Blocking);
        }
        Err(e) => {
          tsfn.call(
            Err(Error::from_reason(e.to_string())),
            ThreadsafeFunctionCallMode::Blocking,
          );
        }
      }
    });

    Ok(())
  }

  #[napi]
  pub fn find(&self, filter: String) -> Result<InternalPoloDbCursor> {
    let doc: Document = document::hex_to_bson(filter)?;

    Ok(InternalPoloDbCursor {
      filter: doc,
      collection: Arc::clone(&self.inner),
      _db: Arc::clone(&self._db),
      skip: None,
      limit: None,
      sort: None,
    })
  }

  #[napi(
    ts_args_type = "filter: string, update: string, callback: (err: null | Error, result: string) => void"
  )]
  pub fn update_one(&self, filter: String, update: String, callback: JsFunction) -> Result<()> {
    let inner = Arc::clone(&self.inner);
    let db = Arc::clone(&self._db);

    let tsfn: ThreadsafeFunction<String> =
      callback.create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;

    let filter_doc = match document::hex_to_bson(filter) {
      Ok(d) => d,
      Err(e) => {
        tsfn.call(Err(e), ThreadsafeFunctionCallMode::Blocking);
        return Ok(());
      }
    };

    let update_doc = match document::hex_to_bson(update) {
      Ok(d) => d,
      Err(e) => {
        tsfn.call(Err(e), ThreadsafeFunctionCallMode::Blocking);
        return Ok(());
      }
    };

    std::thread::spawn(move || {
      if db.lock().is_err() {
        tsfn.call(
          Err(Error::from_reason("Database connection is closed")),
          ThreadsafeFunctionCallMode::Blocking,
        );
        return;
      }

      match inner.update_one(filter_doc, update_doc) {
        Ok(result) => {
          let response = document::bson_to_hex(&doc! {
              "matched_count": result.matched_count as i64,
              "modified_count": result.modified_count as i64,
          });
          tsfn.call(Ok(response), ThreadsafeFunctionCallMode::Blocking);
        }
        Err(e) => {
          tsfn.call(
            Err(Error::from_reason(e.to_string())),
            ThreadsafeFunctionCallMode::Blocking,
          );
        }
      }
    });

    Ok(())
  }

  #[napi(
    ts_args_type = "filter: string, update: string, callback: (err: null | Error, result: string) => void"
  )]
  pub fn update_many(&self, filter: String, update: String, callback: JsFunction) -> Result<()> {
    let inner = Arc::clone(&self.inner);
    let db = Arc::clone(&self._db);

    let tsfn: ThreadsafeFunction<String> =
      callback.create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;

    let filter_doc = match document::hex_to_bson(filter) {
      Ok(d) => d,
      Err(e) => {
        tsfn.call(Err(e), ThreadsafeFunctionCallMode::Blocking);
        return Ok(());
      }
    };

    let update_doc = match document::hex_to_bson(update) {
      Ok(d) => d,
      Err(e) => {
        tsfn.call(Err(e), ThreadsafeFunctionCallMode::Blocking);
        return Ok(());
      }
    };

    std::thread::spawn(move || {
      if db.lock().is_err() {
        tsfn.call(
          Err(Error::from_reason("Database connection is closed")),
          ThreadsafeFunctionCallMode::Blocking,
        );
        return;
      }

      match inner.update_many(filter_doc, update_doc) {
        Ok(result) => {
          let response = document::bson_to_hex(&doc! {
              "matched_count": result.matched_count as i64,
              "modified_count": result.modified_count as i64,
          });
          tsfn.call(Ok(response), ThreadsafeFunctionCallMode::Blocking);
        }
        Err(e) => {
          tsfn.call(
            Err(Error::from_reason(e.to_string())),
            ThreadsafeFunctionCallMode::Blocking,
          );
        }
      }
    });

    Ok(())
  }

  #[napi(ts_args_type = "filter: string, callback: (err: null | Error, result: string) => void")]
  pub fn delete_one(&self, filter: String, callback: JsFunction) -> Result<()> {
    let inner = Arc::clone(&self.inner);
    let db = Arc::clone(&self._db);

    let tsfn: ThreadsafeFunction<String> =
      callback.create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;

    let filter_doc = match document::hex_to_bson(filter) {
      Ok(d) => d,
      Err(e) => {
        tsfn.call(Err(e), ThreadsafeFunctionCallMode::Blocking);
        return Ok(());
      }
    };

    std::thread::spawn(move || {
      if db.lock().is_err() {
        tsfn.call(
          Err(Error::from_reason("Database connection is closed")),
          ThreadsafeFunctionCallMode::Blocking,
        );
        return;
      }

      match inner.delete_one(filter_doc) {
        Ok(result) => {
          let response = document::bson_to_hex(&doc! {
              "deleted_count": result.deleted_count as i64,
          });
          tsfn.call(Ok(response), ThreadsafeFunctionCallMode::Blocking);
        }
        Err(e) => {
          tsfn.call(
            Err(Error::from_reason(e.to_string())),
            ThreadsafeFunctionCallMode::Blocking,
          );
        }
      }
    });

    Ok(())
  }

  #[napi(ts_args_type = "filter: string, callback: (err: null | Error, result: string) => void")]
  pub fn delete_many(&self, filter: String, callback: JsFunction) -> Result<()> {
    let inner = Arc::clone(&self.inner);
    let db = Arc::clone(&self._db);

    let tsfn: ThreadsafeFunction<String> =
      callback.create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;

    let filter_doc = match document::hex_to_bson(filter) {
      Ok(d) => d,
      Err(e) => {
        tsfn.call(Err(e), ThreadsafeFunctionCallMode::Blocking);
        return Ok(());
      }
    };

    std::thread::spawn(move || {
      if db.lock().is_err() {
        tsfn.call(
          Err(Error::from_reason("Database connection is closed")),
          ThreadsafeFunctionCallMode::Blocking,
        );
        return;
      }

      match inner.delete_many(filter_doc) {
        Ok(result) => {
          let response = document::bson_to_hex(&doc! {
              "deleted_count": result.deleted_count as i64,
          });
          tsfn.call(Ok(response), ThreadsafeFunctionCallMode::Blocking);
        }
        Err(e) => {
          tsfn.call(
            Err(Error::from_reason(e.to_string())),
            ThreadsafeFunctionCallMode::Blocking,
          );
        }
      }
    });

    Ok(())
  }
}

#[napi]
impl InternalPoloDbCursor {
  #[napi]
  pub fn skip(&mut self, n: i64) -> &Self {
    self.skip = Some(n as u64);
    self
  }

  #[napi]
  pub fn limit(&mut self, n: i64) -> &Self {
    self.limit = Some(n as u64);
    self
  }

  #[napi]
  pub fn sort(&mut self, sort_doc: String) -> Result<&Self> {
    let sort = document::hex_to_bson(sort_doc)?;
    self.sort = Some(sort);
    Ok(self)
  }

  #[napi(ts_args_type = "callback: (err: null | Error, result: string) => void")]
  pub fn to_array(&self, callback: JsFunction) -> Result<()> {
    let collection = Arc::clone(&self.collection);
    let db = Arc::clone(&self._db);
    let filter = self.filter.clone();
    let skip = self.skip;
    let limit = self.limit;
    let sort = self.sort.clone();

    let tsfn: ThreadsafeFunction<String> =
      callback.create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;

    std::thread::spawn(move || {
      if db.lock().is_err() {
        tsfn.call(
          Err(Error::from_reason("Database connection is closed")),
          ThreadsafeFunctionCallMode::Blocking,
        );
        return;
      }

      let mut find = collection.find(filter);

      if let Some(skip) = skip {
        find = find.skip(skip);
      }

      if let Some(limit) = limit {
        find = find.limit(limit);
      }

      if let Some(sort) = sort {
        find = find.sort(sort);
      }

      match find.run() {
        Ok(cursor) => {
          let mut results = Vec::new();
          for doc_result in cursor {
            match doc_result {
              Ok(doc) => results.push(doc),
              Err(e) => {
                tsfn.call(
                  Err(Error::from_reason(e.to_string())),
                  ThreadsafeFunctionCallMode::Blocking,
                );
                return;
              }
            }
          }

          let response = document::bson_to_hex(&doc! {
              "results": results
          });
          tsfn.call(Ok(response), ThreadsafeFunctionCallMode::Blocking);
        }
        Err(e) => {
          tsfn.call(
            Err(Error::from_reason(e.to_string())),
            ThreadsafeFunctionCallMode::Blocking,
          );
        }
      }
    });

    Ok(())
  }
}
