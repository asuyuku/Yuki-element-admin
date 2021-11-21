import {Module} from "vuex";
import {PermissionState, RootStateTypes} from "@store/interface";
import {RouteRecordRaw} from 'vue-router'
import {constantRoutes} from '@/router'
import {getRouteList} from "@api/system/menu";


const hasPermission = (roles: string[], route: RouteRecordRaw) => {
    // 超级管理员放行
    if (roles.includes('ROOT')) {
        return true
    }
    if (route.meta && route.meta.roles) {
        return roles.some(role => {
            if (route.meta?.roles !== undefined) {
                return (route.meta.roles as string[]).includes(role);
            }
        })
    } else {
        return true
    }
}

export const filterAsyncRoutes = (routes: RouteRecordRaw[], roles: string[]) => {
    const res: RouteRecordRaw[] = []
    routes.forEach(route => {
        const tmp = {...route}
        if (hasPermission(roles, tmp)) {
            if (tmp.children) {
                tmp.children = filterAsyncRoutes(tmp.children, roles)
            }
            res.push(tmp)
        }
    })
    return res
}


const permissionModule: Module<PermissionState, RootStateTypes> = {
    namespaced: true,
    state: {
        routes: [],
        addRoutes: []
    },
    mutations: {
        SET_ROUTES: (state: PermissionState, routes: RouteRecordRaw[]) => {
            state.addRoutes = routes
            state.routes = constantRoutes.concat(routes)
        }
    },
    actions: {
        generateRoutes({commit}, roles: string[]) {
            return new Promise((resolve, reject) => {
                getRouteList().then(response => {
                    const asyncRoutes = response.data
                    let accessedRoutes = filterAsyncRoutes(asyncRoutes, roles)
                    commit('SET_ROUTES', accessedRoutes)
                    resolve(accessedRoutes)
                }).catch(error => {
                    reject(error)
                })
            })
        }

    }
}
export default permissionModule;
