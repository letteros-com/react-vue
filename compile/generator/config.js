const TAB_INDENT = '    '
// const CREATE_ELEMENT = 'React.createElement'
// const HELPER_HEADER = '__react__vue__'
// const HELPER_HEADER_NATIVE = '__react__vue__native__'

const CREATE_ELEMENT = 'h'
const HELPER_HEADER = ''
const HELPER_HEADER_NATIVE = ''

const COMMON = {
  'slot': {
    name: `${HELPER_HEADER}slot`
  },
  'renderList': {
    name: `${HELPER_HEADER}renderList`,
    alias: 'renderList'
  }
}

const WEB = {
  'bindClass': {
    name: `${HELPER_HEADER}bindClass`,
    alias: `bindWebClass`
  },
  'bindStyle': {
    name: `${HELPER_HEADER}bindStyle`,
    alias: `bindWebStyle`
  }
}

const NATIVE = {}

module.exports = {
  COMMON,
  WEB,
  NATIVE,
  TAB_INDENT,
  CREATE_ELEMENT
}
