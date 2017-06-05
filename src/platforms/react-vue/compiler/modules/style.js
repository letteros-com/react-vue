import changeCase from 'change-case'

export default function parseStyleText (cssText) {
  const res = {}
  const listDelimiter = /;(?![^(]*\))/g
  const propertyDelimiter = /:(.+)/
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      var tmp = item.split(propertyDelimiter)
      tmp.length > 1 && (res[changeCase.camelCase(tmp[0].trim())] = tmp[1].trim())
    }
  })
  return res
}
