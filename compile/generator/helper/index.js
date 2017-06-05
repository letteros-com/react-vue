function bindWebClass (classBinding) {
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
};

function bindWebStyle (styleBinding) {
  const type = Object.prototype.toString.call(styleBinding)
  if (type === '[object Object]') {
    let style = ''
    for (const k in styleBinding) {
      style += `${k}: ${styleBinding[k]};`
    }
    return style
  } else if (type === '[object Array]') {
    return styleBinding.map((v) => {
      return bindWebStyle(v)
    }).join('')
  }
  let another = ''
  try {
    another = JSON.stringify(styleBinding)
  } catch (e) {
    console.error('there are invalidate style binding for' + styleBinding)
  }
  return another
}

function renderList (val, render) {
  let ret, i, l, keys, key
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length)
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i)
    }
  } else if (typeof val === 'number') {
    ret = new Array(val)
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i)
    }
  } else if (Object.prototype.toString.call(val) === '[object Object]') {
    keys = Object.keys(val)
    ret = new Array(keys.length)
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i]
      ret[i] = render(val[key], key, i)
    }
  }
  return ret
}

module.exports = {
  bindWebClass,
  bindWebStyle,
  renderList
}
