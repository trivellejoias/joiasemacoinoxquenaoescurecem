/* eslint-disable */
// This file is generated for the file-based TanStack Router tree.
// Keep it committed so the Cloudflare build has the complete file-based route tree.
import { Route as rootRoute } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AdminRouteImport } from './routes/admin'
import { Route as ProductsProductIdRouteImport } from './routes/products/$productId'
import { Route as CheckoutCancelRouteImport } from './routes/checkout/cancel'
import { Route as CheckoutSuccessRouteImport } from './routes/checkout/success'
import { Route as AdminAuthRouteImport } from './routes/admin-auth'
import { Route as CatalogDataRouteImport } from './routes/catalog-data'
import { Route as AnalyticsRouteImport } from './routes/analytics'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const AdminRoute = AdminRouteImport.update({
  id: '/admin',
  path: '/admin',
  getParentRoute: () => rootRoute,
} as any)

const ProductsProductIdRoute = ProductsProductIdRouteImport.update({
  id: '/products/$productId',
  path: '/products/$productId',
  getParentRoute: () => rootRoute,
} as any)

const CheckoutCancelRoute = CheckoutCancelRouteImport.update({
  id: '/checkout/cancel',
  path: '/checkout/cancel',
  getParentRoute: () => rootRoute,
} as any)

const CheckoutSuccessRoute = CheckoutSuccessRouteImport.update({
  id: '/checkout/success',
  path: '/checkout/success',
  getParentRoute: () => rootRoute,
} as any)

const AdminAuthRoute = AdminAuthRouteImport.update({
  id: '/admin-auth',
  path: '/admin-auth',
  getParentRoute: () => rootRoute,
} as any)

const CatalogDataRoute = CatalogDataRouteImport.update({
  id: '/catalog-data',
  path: '/catalog-data',
  getParentRoute: () => rootRoute,
} as any)

const AnalyticsRoute = AnalyticsRouteImport.update({
  id: '/analytics',
  path: '/analytics',
  getParentRoute: () => rootRoute,
} as any)

const routeTree = rootRoute.addChildren({
  IndexRoute,
  AdminRoute,
  ProductsProductIdRoute,
  CheckoutCancelRoute,
  CheckoutSuccessRoute,
  AdminAuthRoute,
  CatalogDataRoute,
  AnalyticsRoute,
})

export { routeTree }
