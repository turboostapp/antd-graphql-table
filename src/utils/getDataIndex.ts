export default (dataIndex: string | number | (string | number)[]) => {
  return dataIndex instanceof Array
    ? dataIndex.map((item) => String(item)).join(".")
    : String(dataIndex);
};
