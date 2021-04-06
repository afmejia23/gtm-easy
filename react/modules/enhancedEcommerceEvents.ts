import push from './push'
import {
  Order,
  PixelMessage,
  ProductOrder,
  // Impression,
  CartItem,
} from '../typings/events'
import { AnalyticsEcommerceProduct } from '../typings/gtm'

export function sendEnhancedEcommerceEvents(e: PixelMessage, pathname: any) {
  function checkCenco(promo: any) {
    if (promo?.split(' ')[0].split('_').length > 2) return true
    else return false
  }

  function calculateCencoPrice(name: any, listPrice: any) {
    const mechanic = name?.split(' ')[0].split('_')[0]
    const value = parseInt(name?.split(' ')[0].split('_')[1])

    switch (mechanic) {
      case 'D':
        return listPrice * ((100 - value) / 100)
      case 'PF':
        return value
      default:
        return null
    }
  }

  let list = ''
  const words = pathname.split('/')
  const currentSearch = window.location.search

  // Define list value
  if (pathname === '/') {
    list = 'HOME Carrusel: '
  } else if (words[words.length - 1] === 'p') {
    list = 'PDP recommendations: '
  } else if (currentSearch) {
    list = 'PLP Search: '
  } else {
    list = 'PLP category: '
  }

  switch (e.data.eventName) {
    case 'vtex:productView': {
      const { selectedSku, productName, brand, categories } = e.data.product

      let price, listPrice, commertialOffer

      try {
        commertialOffer = e.data.product.items[0].sellers[0].commertialOffer
        price = commertialOffer.Price
        listPrice = commertialOffer.ListPrice
      } catch {
        price = undefined
        listPrice = undefined
        commertialOffer = undefined
      }

      const data = {
        ecommerce: {
          detail: {
            products: [
              {
                brand,
                category: getCategory(categories),
                id: selectedSku.itemId,
                name: productName,
                variant: selectedSku.name,
                price,
                listPrice,
                discount: `${getDiscount(commertialOffer)}%`,
                list: `PLP Category: ${getCategory(categories)}`,
              },
            ],
          },
        },
        event: 'productDetail',
      }

      push(data)

      return
    }

    case 'myProductClickEvent': {
      const product = e.data.data.Product

      const { productName, brand, categories, sku } = product
      // const list = e.data.list ? { actionField: { list: e.data.list } } : {}

      let price, listPrice, commertialOffer, promotion, cencoPrice

      try {
        commertialOffer = product.items[0].sellers[0].commertialOffer
        promotion = commertialOffer?.teasers[0]?.name
        price = commertialOffer.Price
        listPrice = commertialOffer.ListPrice
        const isCenco = promotion ? checkCenco(promotion) : false

        if (isCenco) {
          cencoPrice = calculateCencoPrice(promotion, listPrice)
        } else {
          cencoPrice = listPrice
        }
      } catch {
        price = undefined
        listPrice = undefined
        commertialOffer = undefined
      }

      const data = {
        event: 'newProductClick',
        ecommerce: {
          click: {
            // ...list,
            products: [
              {
                brand,
                category: getCategory(categories),
                id: sku.itemId,
                name: productName,
                variant: sku.name,
                price,
                listPrice,
                cencoPrice,
                discount: `${getDiscount(commertialOffer)}%`,
                list: `${list}${getCategory(categories)}`,
              },
            ],
          },
        },
      }

      push(data)

      return
    }

    case 'myProductEvent': {
      const product = e.data.data.Product.product

      let price, listPrice, commertialOffer, promotion, cencoPrice

      try {
        commertialOffer = product.items[0].sellers[0].commertialOffer
        promotion = commertialOffer?.teasers[0]?.name
        price = commertialOffer.Price
        listPrice = commertialOffer.ListPrice
        const isCenco = promotion ? checkCenco(promotion) : false

        if (isCenco) {
          cencoPrice = calculateCencoPrice(promotion, listPrice)
        } else {
          cencoPrice = listPrice
        }
      } catch {
        price = undefined
        listPrice = undefined
        commertialOffer = undefined
      }

      const data = {
        ecommerce: {
          detail: {
            products: [
              {
                brand: product?.brand,
                category: getCategory(product?.categories),
                id: product?.sku?.itemId,
                name: product?.productName,
                variant: product?.sku?.name,
                price,
                listPrice,
                cencoPrice,
                discount: `${getDiscount(commertialOffer)}%`,
                list: `${getCategory(product?.categories)}`,
              },
            ],
          },
        },
        event: 'newProductDetail',
      }

      push(data)

      return
    }

    case 'vtex:productClick': {
      const { productName, brand, categories, sku } = e.data.product
      const list = e.data.list ? { actionField: { list: e.data.list } } : {}

      let price, listPrice, commertialOffer

      try {
        commertialOffer = e.data.product.items[0].sellers[0].commertialOffer
        price = commertialOffer.Price
        listPrice = commertialOffer.ListPrice
      } catch {
        price = undefined
        listPrice = undefined
        commertialOffer = undefined
      }

      const data = {
        event: 'productClick',
        ecommerce: {
          click: {
            ...list,
            products: [
              {
                brand,
                category: getCategory(categories),
                id: sku.itemId,
                name: productName,
                variant: sku.name,
                price,
                listPrice,
                discount: `${getDiscount(commertialOffer)}%`,
                list: `${getCategory(categories)}`,
              },
            ],
          },
        },
      }

      push(data)

      return
    }

    case 'vtex:addToCart': {
      const { items } = e.data
      const words = window.location.href.split('/')

      if (words[words.length - 1] !== 'p') {
        push({
          ecommerce: {
            click: {
              products: items.map((sku: any) => ({
                brand: sku.brand,
                category: sku.category,
                id: sku.skuId,
                name: sku.name,
                price: sku.price / 100,
                quantity: sku.quantity,
                variant: sku.variant,
              })),
            },
            currencyCode: e.data.currency,
          },
          event: 'productClick',
        })
      }

      push({
        ecommerce: {
          add: {
            products: items.map((sku: any) => ({
              brand: sku.brand,
              category: sku.category,
              id: sku.skuId,
              name: sku.name,
              price: sku.price / 100,
              quantity: sku.quantity,
              variant: sku.variant,
            })),
          },
          currencyCode: e.data.currency,
        },
        event: 'addToCart',
      })

      return
    }

    case 'vtex:removeFromCart': {
      const { items } = e.data

      push({
        ecommerce: {
          currencyCode: e.data.currency,
          remove: {
            products: items.map((sku: any) => ({
              brand: sku.brand,
              id: sku.skuId,
              category: sku.category,
              name: sku.name,
              price: `${sku.price}`,
              quantity: sku.quantity,
              variant: sku.variant,
            })),
          },
        },
        event: 'removeFromCart',
      })

      return
    }

    case 'vtex:orderPlaced': {
      const order = e.data

      const ecommerce = {
        purchase: {
          actionField: getPurchaseObjectData(order),
          products: order.transactionProducts.map((product: ProductOrder) =>
            getProductObjectData(product)
          ),
        },
      }

      push({
        // @ts-ignore
        event: 'orderPlaced',
        ...order,
        ecommerce,
      })

      // Backwards compatible eventimport { ApolloQueryResult } from 'apollo-client'
      push({
        ecommerce,
        event: 'pageLoaded',
      })

      return
    }

    case 'vtex:productImpression': {
      const { currency, impressions, product, position } = e.data

      let oldImpresionFormat: Record<string, any> | null = null

      if (product != null && position != null) {
        // make it backwards compatible
        oldImpresionFormat = [
          getProductImpressionObjectData()({
            product,
            position,
          }),
        ]
      }

      const parsedImpressions = (impressions || []).map(
        getProductImpressionObjectData()
      )

      // // Change value of list field
      const impressionsWithList = (oldImpresionFormat || parsedImpressions).map(
        function(item: any) {
          item.list = `${list}${item.list}`
          return item
        }
      )

      push({
        event: 'productImpression',
        ecommerce: {
          currencyCode: currency,
          impressions: impressionsWithList,
        },
      })

      return
    }

    case 'vtex:cartLoaded': {
      const { orderForm } = e.data

      push({
        event: 'checkout',
        ecommerce: {
          checkout: {
            actionField: {
              step: 1,
            },
            products: orderForm.items.map(getCheckoutProductObjectData),
          },
        },
      })

      break
    }

    case 'vtex:promoView': {
      const { promotions } = e.data

      push({
        event: 'promoView',
        ecommerce: {
          promoView: {
            promotions: promotions,
          },
        },
      })
      break
    }

    case 'vtex:promotionClick': {
      const { promotions } = e.data

      push({
        event: 'promotionClick',
        ecommerce: {
          promoClick: {
            promotions: promotions,
          },
        },
      })
      break
    }

    default: {
      break
    }
  }
}

function getPurchaseObjectData(order: Order) {
  return {
    affiliation: order.transactionAffiliation,
    coupon: order.coupon ? order.coupon : null,
    id: order.orderGroup,
    revenue: order.transactionTotal,
    shipping: order.transactionShipping,
    tax: order.transactionTax,
  }
}

function getProductObjectData(product: ProductOrder) {
  return {
    brand: product.brand,
    category: product.categoryTree?.join('/'),
    id: product.sku,
    name: product.name,
    price: product.price,
    quantity: product.quantity,
    variant: product.skuName,
  }
}

function getCategory(rawCategories: string[]) {
  if (!rawCategories || !rawCategories.length) {
    return
  }

  return removeStartAndEndSlash(rawCategories[0])
}

// Transform this: "/Apparel & Accessories/Clothing/Tops/"
// To this: "Apparel & Accessories/Clothing/Tops"
function removeStartAndEndSlash(category?: string) {
  return category?.replace(/^\/|\/$/g, '')
}

function getDiscount(commertialOffer: any) {
  const previousPriceValue = commertialOffer.ListPrice
  const newPriceValue = commertialOffer.Price
  const savingsValue = previousPriceValue - newPriceValue
  const savingsPercentage = Math.round(
    (savingsValue / previousPriceValue) * 100
  )

  return savingsPercentage
}

function getSAPSpecs(specs: any[]) {
  const found = specs.find(elem => elem.name === 'Campos SAP')
  return found
}

function getProductImpressionObjectData() {
  return ({ product, position }: any) => ({
    brand: product.brand,
    category: getCategory(product.categories),
    id: product.sku.itemId,
    list: getCategory(product.categories),
    name: product.productName,
    position,
    price: `${product.sku.seller!.commertialOffer.Price}`,
    variant: product.sku.name,
    listPrice: `${product.sku.seller!.commertialOffer.ListPrice}`,
    discount: `${getDiscount(product.sku.seller!.commertialOffer)}%`,
    SAPSection: getSAPSpecs(product.specificationGroups),
  })
}

function getCheckoutProductObjectData(
  item: CartItem
): AnalyticsEcommerceProduct {
  return {
    id: item.id,
    name: item.name,
    category: Object.keys(item.productCategories ?? {}).reduce(
      (categories, category) =>
        categories ? `${categories}/${category}` : category,
      ''
    ),
    brand: item.additionalInfo?.brandName ?? '',
    variant: item.skuName,
    price: item.sellingPrice / 100,
    quantity: item.quantity,
  }
}
