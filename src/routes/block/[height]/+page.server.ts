import type { PageServerLoad } from "./$types"
import { API } from "$lib/server/api/api"
import { APIError } from "$lib/server/api/base"
import { error } from "@sveltejs/kit"
import { app_error_from_api_error } from "$lib/utils"

export const load: PageServerLoad = async ({ params }) => {
  const { height } = params
  try {
    return {
      block: await API.instance.block(height),
      height: height,
    }
  } catch (err) {
    console.log(err)
    if (err instanceof APIError) {
      return error(500, app_error_from_api_error(err))
    }
    throw err
  }
}
