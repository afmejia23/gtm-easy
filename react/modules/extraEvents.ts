import push from './push'
import { PixelMessage } from '../typings/events'

export function sendExtraEvents(e: PixelMessage) {
  // Detect when URL changes
  const locationHashChanged = () => {
    let title

    switch (location.hash) {
      case '#/profile':
        title = 'My acccount - profile'
        break
      case '#/cards':
        title = 'My acccount - cards'
        break
      case '#/addresses':
        title = 'My acccount - addresses'
        break
      case '#/orders':
        title = 'My acccount - orders'
        break
      case '#/wishlist':
        title = 'My account - wishlist'
        break
      default:
        break
    }

    if (location.href.includes('account')) {
      push({
        event: 'pageViewVirtual',
        location: location.href,
        page: location.href + location.hash,
        title,
      })
    }

    console.log(location.hash)
  }

  window.onhashchange = locationHashChanged

  switch (e.data.eventName) {
    case 'vtex:pageView': {
      const page = e.data.pageUrl.replace(e.origin, '')

      switch (e.data.routeId) {
        case 'store.custom#allProductOffers': {
          push({
            event: 'pageViewVirtual',
            location: e.data.pageUrl,
            page,
            referrer: e.data.referrer,
            title: 'Landing Ofertas',
          })
          return
        }

        case 'store.search#subcategory': {
          push({
            event: 'pageViewVirtual',
            location: e.data.pageUrl,
            page,
            referrer: e.data.referrer,
            title: 'PLP - Category',
          })
          return
        }

        case 'store.orderplaced': {
          push({
            event: 'pageViewVirtual',
            location: e.data.pageUrl,
            page,
            referrer: e.data.referrer,
            title: 'Checkout - Confirmation',
          })
          return
        }
      }

      if (
        e.data.routeId === 'store.search' ||
        e.data.routeId === 'store.search#department'
      ) {
        if (page.includes('?q=') || page.includes('?_q=')) {
          push({
            event: 'pageViewVirtual',
            location: e.data.pageUrl,
            page,
            referrer: e.data.referrer,
            title: 'PLP - Search',
          })
        } else {
          push({
            event: 'pageViewVirtual',
            location: e.data.pageUrl,
            page,
            referrer: e.data.referrer,
            title: 'PLP - Category',
          })
        }
      }

      const wordsForPDP = e.data.pageUrl.split('/')
      if (wordsForPDP[wordsForPDP.length - 1] === 'p') {
        push({
          event: 'pageViewVirtual',
          location: e.data.pageUrl,
          page,
          referrer: e.data.referrer,
          title: 'PDP',
        })
      }

      if (e.data.routeId === 'store.home') {
        push({
          event: 'pageViewVirtual',
          location: e.data.pageUrl,
          page,
          referrer: e.data.referrer,
          title: 'Home',
        })
      }

      if (e.data.routeId === 'store.search#category') {
        push({
          event: 'pageViewVirtual',
          location: e.data.pageUrl,
          page,
          referrer: e.data.referrer,
          title: 'PLP - Category',
        })
      }

      return
    }

    case 'vtex:userData': {
      const { data } = e

      if (!data.isAuthenticated) {
        return
      }

      push({
        event: 'userData',
        userId: data.id,
      })

      return
    }

    default: {
      return
    }
  }
}
