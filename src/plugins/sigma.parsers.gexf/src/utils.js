export function getModelTags(xml) {
  const attributesTags = xml.getElementsByTagName("attributes");
  const modelTags = {};
  for (let i = 0; i < attributesTags.length; i++)
    modelTags[attributesTags[i].getAttribute("class")] =
      attributesTags[i].childNodes;

  return modelTags;
}

export function nodeListToArray(nodeList) {
  // Return array
  const children = [];

  // Iterating
  for (let i = 0, len = nodeList.length; i < len; ++i) {
    if (nodeList[i].nodeName !== "#text") children.push(nodeList[i]);
  }

  return children;
}
export function nodeListEach(nodeList, func) {
  // Iterating
  for (let i = 0, len = nodeList.length; i < len; ++i) {
    if (nodeList[i].nodeName !== "#text") func(nodeList[i]);
  }
}

export function nodeListToHash(nodeList, filter) {
  // Return object
  const children = {};

  // Iterating
  for (let i = 0; i < nodeList.length; i++) {
    if (nodeList[i].nodeName !== "#text") {
      const prop = filter(nodeList[i]);
      children[prop.key] = prop.value;
    }
  }

  return children;
}

export function namedNodeMapToObject(nodeMap) {
  // Return object
  const attributes = {};

  // Iterating
  for (let i = 0; i < nodeMap.length; i++) {
    attributes[nodeMap[i].name] = nodeMap[i].value;
  }

  return attributes;
}

export function getFirstElementByTagNS(node, ns, tag) {
  let el = node.getElementsByTagName(`${ns}:${tag}`)[0];

  if (!el) {
    // eslint-disable-next-line prefer-destructuring
    el = node.getElementsByTagNameNS(ns, tag)[0];
  }

  if (!el) {
    // eslint-disable-next-line prefer-destructuring
    el = node.getElementsByTagName(tag)[0];
  }

  return el;
}

export function getAttributeNS(node, ns, attribute) {
  let attrValue = node.getAttribute(`${ns}:${attribute}`);
  if (attrValue === undefined) attrValue = node.getAttributeNS(ns, attribute);
  if (attrValue === undefined) attrValue = node.getAttribute(attribute);
  return attrValue;
}

export function enforceType(type, value) {
  switch (type) {
    case "boolean":
      value = value === "true";
      break;
    case "integer":
    case "long":
    case "float":
    case "double":
      value = +value;
      break;
    case "liststring":
      value = value ? value.split("|") : [];
      break;
    default:
    // do nothing
  }

  return value;
}

export function getRGB(values) {
  return values[3]
    ? `rgba(${values.join(",")})`
    : `rgb(${values.slice(0, -1).join(",")})`;
}
