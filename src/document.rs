use napi::Result;
use polodb_core::bson::Document;

pub fn hex_to_bson(str: String) -> Result<Document> {
  let bytes = hex::decode(str).unwrap();
  let doc = Document::from_reader(&mut bytes.as_slice()).unwrap();
  Ok(doc)
}

pub fn bson_to_hex(document: &Document) -> String {
  let bytes = bson::to_vec(&document).unwrap();
  hex::encode(bytes)
}
