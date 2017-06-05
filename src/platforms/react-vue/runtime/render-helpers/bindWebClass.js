export function bindWebClass (classBinding) {
  const type = Object.prototype.toString.call(classBinding)
  if (type === '[object Object]') {
    return Object.keys(classBinding).filter((k) => {
      return !!classBinding[k]
    }).join(' ')
  } else if (type === '[object Array]') {
    return classBinding.map((v) => {
      return bindWebClass(v)
    }).join(' ')
  }
  return classBinding
}
