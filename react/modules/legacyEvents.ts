import push from './push'
import { PixelMessage, SearchPageInfoData } from '../typings/events'

export function sendLegacyEvents(e: PixelMessage) {
  switch (e.data.eventName) {
    case 'vtex:pageInfo': {
      const { eventType } = e.data

      switch (eventType) {
        case 'homeView': {
          push({
            event: 'homeView',
          })
          break
        }

        case 'categoryView': {
          const data = e.data as SearchPageInfoData

          push({
            event: 'categoryView',
            departmentId: data.department?.id,
            departmentName: data.department?.name,
            categoryId: data.category?.id,
            categoryName: data.category?.name,
          })
          break
        }

        case 'departmentView': {
          const data = e.data as SearchPageInfoData

          push({
            event: 'departmentView',
            departmentId: data.department?.id,
            departmentName: data.department?.name,
          })
          break
        }

        case 'emptySearchView':
        case 'internalSiteSearchView': {
          const data = e.data

          const comp = document.getElementsByClassName(
            'vtex-search-2-x-didYouMeanTerm'
          )[0]
          let corrected = ''
          if (comp) {
            corrected = comp.getElementsByTagName('a')[0]?.innerText
          }

          push({
            event: 'interaccion',
            category:
              data.search.correction.misspelled && data.search.results > 0
                ? 'Search Autocorrection'
                : 'Busqueda',
            action:
              data.search.results > 0
                ? data.search.correction.misspelled
                  ? data.search?.term
                  : 'Con resultados'
                : 'Sin resultados',
            tag: corrected ? corrected : data.search?.term,
          })

          push({
            event: 'internalSiteSearchView',
            siteSearchTerm: data.search?.term,
            siteSearchForm: window.location.href,
            siteSearchCategory: data.search?.category?.id,
            siteSearchResults: data.search?.results,
          })
          break
        }

        case 'productView': {
          push({
            event: 'productView',
          })
          break
        }

        default: {
          push({
            event: 'otherView',
          })
          break
        }
      }

      return
    }
  }
}
