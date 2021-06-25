import push from './push'
import {
  Order,
  PixelMessage,
  ProductOrder,
  // Impression,
  ProductViewData,
  CartItem,
  Seller,
} from '../typings/events'
import { AnalyticsEcommerceProduct } from '../typings/gtm'

function getSeller(sellers: Seller[]) {
  const defaultSeller = sellers.find(seller => seller.sellerDefault)

  if (!defaultSeller) {
    return sellers[0]
  }

  return defaultSeller
}

// Listen when click on "-" within the minicart
let minusClicked = false,
  plusClicked = false
let removeElements: any, addElements: any
let observer = new MutationObserver(() => {
  removeElements = document.querySelectorAll(
    '[aria-label="Cantidad decreciente"]'
  )
  addElements = document.querySelectorAll('[aria-label="Aumentar la cantidad"]')

  if (removeElements) {
    for (let i = 0; i < removeElements.length; i++) {
      removeElements[i].addEventListener(
        'click',
        () => {
          minusClicked = true
        },
        false
      )
    }
  }

  if (addElements) {
    for (let i = 0; i < addElements.length; i++) {
      addElements[i].addEventListener(
        'click',
        () => {
          plusClicked = true
        },
        false
      )
    }
  }
})
observer.observe(document, { childList: true, subtree: true })

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
    list = 'HOME Carrusel: Productos destacados'
  } else if (words[words.length - 1] === 'p') {
    list = 'PDP recommendations: Otros clientes también vieron'
  } else if (currentSearch) {
    list = 'PLP Search: '
  } else {
    list = 'PLP category: '
  }

  switch (e.data.eventName) {
    case 'vtex:productView': {
      console.log('Product Detail information-------------------->')
      console.log(e)

      const {
        selectedSku,
        productName,
        brand,
        categories,
      } = (e.data as ProductViewData).product

      let price

      try {
        price = getSeller(e.data.product.items[0].sellers).commertialOffer.Price
      } catch {
        price = undefined
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
              },
            ],
          },
        },
        event: 'productDetail',
      }

      push(data)

      return
    }

    case 'vtex:productClick': {
      const product = e.data.product

      const { productName, brand, categories, sku } = product

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

      const termSearched = window.location.pathname.split('/')[1]
      let listTerm

      if (list === 'PLP Search: ') {
        listTerm = `${list}${termSearched}`
      } else {
        listTerm = `${list}${getCategory(categories)}`

        if (
          list !== 'HOME Carrusel: Productos destacados' &&
          list !== 'PDP recommendations: Otros clientes también vieron'
        ) {
          listTerm = `${list}${getCategory(categories)}`
        } else {
          listTerm = list
        }
      }

      const data = {
        event: 'newProductDetail',
        ecommerce: {
          detail: {
            // ...list,
            actionField: {
              list: listTerm,
              action: 'detail',
            },
            products: [
              {
                brand,
                category: getCategory(categories),
                id: sku.referenceId.Value,
                name: productName,
                variant: sku.name,
                price,
                listPrice,
                cencoPrice,
                discount: `${getDiscount(commertialOffer)}%`,
                position: e.data.position,
              },
            ],
          },
        },
      }

      push(data)

      // Among us
      const productClick = {
        event: 'newProductClick',
        ecommerce: {
          click: { ...data.ecommerce.detail },
        },
      }
      productClick.ecommerce.click.actionField.action = 'click'
      push(productClick)

      return
    }

    case 'myProductEvent': {
      const product = e.data.data.Product

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

      const termSearched = window.location.pathname.split('/')[1]
      let listTerm

      if (list === 'PLP Search: ') {
        listTerm = `${list}${termSearched}`
      } else {
        listTerm = `${list}${getCategory(product?.categories)}`
      }

      if (
        list !== 'HOME Carrusel: Productos destacados' &&
        list !== 'PDP recommendations: Otros clientes también vieron'
      ) {
        listTerm = `${list}${getCategory(product?.categories)}`
      } else {
        listTerm = list
      }

      const data = {
        ecommerce: {
          detail: {
            products: [
              {
                brand: product?.brand,
                category: getCategory(product?.categories),
                id: product?.sku?.referenceId.Value,
                name: product?.productName,
                variant: product?.sku?.name,
                price,
                listPrice,
                cencoPrice,
                discount: `${getDiscount(commertialOffer)}%`,
                list: listTerm,
              },
            ],
          },
        },
        event: 'newProductDetail',
      }

      push(data)

      return
    }

    // case 'vtex:productClick': {
    //   console.log('Printing productClick Event------------>')
    //   console.log(e)

    // const { productName, brand, categories, sku } = e.data.product
    // const list = e.data.list ? { actionField: { list: e.data.list } } : {}

    // let price, listPrice, commertialOffer

    // try {
    //   commertialOffer = e.data.product.items[0].sellers[0].commertialOffer
    //   price = commertialOffer.Price
    //   listPrice = commertialOffer.ListPrice
    // } catch {
    //   price = undefined
    //   listPrice = undefined
    //   commertialOffer = undefined
    // }

    // const data = {
    //   event: 'productClick',
    //   ecommerce: {
    //     click: {
    //       ...list,
    //       products: [
    //         {
    //           brand,
    //           category: getCategory(categories),
    //           id: sku.itemId,
    //           name: productName,
    //           variant: sku.name,
    //           price,
    //           listPrice,
    //           discount: `${getDiscount(commertialOffer)}%`,
    //           list: `${getCategory(categories)}`,
    //         },
    //       ],
    //     },
    //   },
    // }

    // push(data)

    //   return
    // }

    case 'vtex:addToCart': {
      const { items } = e.data
      console.log('This is the data from the event------------->')
      console.log(e)

      // Include discount if located in a PDP
      const words = window.location.pathname.split('/')
      let discount: string | undefined

      if (!minusClicked) {
        push({
          ecommerce: {
            add: {
              products: items.map((sku: any) => {
                if (words[words.length - 1] == 'p') {
                  // Get discount
                  const component = document.getElementsByClassName(
                    'easycl-precio-cencosud-0-x-porcentajeCenco'
                  )[0]
                  if (component) {
                    discount = component.textContent?.replace('-', '')
                  } else {
                    discount = '0%'
                  }
                } else {
                  const difference = Math.abs(sku.price - sku.sellingPrice)
                  discount = `${Math.round((difference / sku.price) * 100)}%`
                }

                return {
                  brand: sku.brand,
                  category: sku.category,
                  id: sku.productRefId,
                  name: sku.name,
                  listPrice: sku.price / 100,
                  price: sku.sellingPrice / 100,
                  discount,
                  quantity: plusClicked ? 1 : sku.quantity,
                  variant: sku.variant,
                }
              }),
            },
            currencyCode: e.data.currency,
          },
          event: 'addToCart',
        })
        plusClicked = false
        return
      } else {
        push({
          ecommerce: {
            currencyCode: e.data.currency,
            remove: {
              products: items.map((sku: any) => {
                if (words[words.length - 1] == 'p') {
                  // Get discount
                  const component = document.getElementsByClassName(
                    'easycl-precio-cencosud-0-x-porcentajeCenco'
                  )[0]
                  if (component) {
                    discount = component.textContent?.replace('-', '')
                  } else {
                    discount = '0%'
                  }
                } else {
                  const difference = Math.abs(sku.price - sku.sellingPrice)
                  discount = `${Math.round((difference / sku.price) * 100)}%`
                }

                return {
                  brand: sku.brand,
                  category: sku.category,
                  id: sku.skuId,
                  name: sku.name,
                  listPrice: sku.price / 100,
                  price: sku.sellingPrice / 100,
                  discount,
                  quantity: 1,
                  variant: sku.variant,
                }
              }),
            },
          },
          event: 'removeFromCart',
        })
      }

      minusClicked = false

      return
    }

    case 'vtex:removeFromCart': {
      const { items } = e.data
      console.log('Items to be removed----------------------->')
      console.log(items)

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

      const termSearched = window.location.pathname.split('/')[1]
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
          if (list === 'PLP Search: ') {
            item.list = `${list}${termSearched}`
          } else {
            if (
              list !== 'HOME Carrusel: Productos destacados' &&
              list !== 'PDP recommendations: Otros clientes también vieron'
            ) {
              item.list = `${list}${item.list}`
            } else {
              item.list = list
            }
          }
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
  const difference = Math.abs(product.price - product.originalPrice)
  const discount = `${Math.round((difference / product.originalPrice) * 100)}%`

  return {
    brand: product.brand,
    category: product.categoryTree?.join('/'),
    id: product.sku,
    name: product.name,
    price: product.price,
    listPrice: product.originalPrice,
    discount,
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
    id: product.sku.referenceId.Value,
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
