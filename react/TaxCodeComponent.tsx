import React, { FunctionComponent } from 'react'
import useProduct from 'vtex.product-context/useProduct'
import { useQuery } from 'react-apollo'
import productTaxCode from './queries/productTaxCode.graphql'

const TaxCodeComponent: FunctionComponent<any> = ({}) => {
  const { product } = useProduct()
  const { data, loading, error } = useQuery(productTaxCode, {
    variables: { id: product?.productId },
    ssr: false,
  })
  console.log('After fetching------------------------>')
  console.log(data, loading, error)
  console.log('Product--------------->')
  console.log(product)

  if (product) {
    if (loading) {
      return (
        <div>
          <span>Loading...</span>
        </div>
      )
    } else if (error) {
      return (
        <div>
          <span>Error!</span>
        </div>
      )
    } else if (data) {
      console.log(data)
      return (
        <div>
          <span>Data!</span>
        </div>
      )
    } else {
      return (
        <div>
          <span className="taxCode">{product.productId}</span>
        </div>
      )
    }
  } else {
    return (
      <div>
        <span>Content does not exist!</span>
      </div>
    )
  }
}

export default TaxCodeComponent
