# Router
`AIRouter.execute(request)` is the only entry point. It runs the request
through: RequestPipeline → RateLimiter → TaskDispatcher (→ Provider) →
ResponsePipeline → Logger/Monitor. Errors are normalized via ErrorHandler.
