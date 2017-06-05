export function isObjectShallowModified (prev, next) {
  // if (prev == null || next == null || typeof prev !== 'object' || typeof next !== 'object') {
  //   return prev !== next
  // }
  // const keys = Object.keys(prev)
  // if (keys.length !== Object.keys(next).length) {
  //   return true
  // }
  // let key
  // for (let i = keys.length - 1; i >= 0; i--) {
  //   key = keys[i]
  //   if (next[key] !== prev[key]) {
  //     return true
  //   }
  // }
  if (prev.children !== undefined || next.children !== undefined) {
    return true
  }
  for (const k in next) {
    if (typeof next[k] !== 'object') {
      if (next[k] !== prev[k]) {
        return true
      }
    }
  }
  return false
}

