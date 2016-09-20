export default {
  parse(str) {
    return str
      .split('\n')
      .map(row => row.split(','))
      .reject(row => row.length === 1 && !row[0]);
  }
}
