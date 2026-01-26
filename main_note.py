# Created by FC as 2025/1/6
import pymysql
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import uuid
from datetime import datetime
from pydantic import BaseModel
from contextlib import contextmanager

# 192.168.18.20
# 172.17.0.1
# 127.0.0.1
config = {
    'user': 'note',
    'password': 'noteDB',
    'host': '127.0.0.1',
    "port": 3306,
    'database': 'note_db',
    'charset':'utf8mb4',
    'cursorclass':pymysql.cursors.DictCursor  # 返回字典格式
}

cnx = pymysql.connect(**config)
# 创建游标对象
cursor = cnx.cursor()
app = FastAPI()
# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 数据库连接上下文管理器
@contextmanager
def get_db_connection():
    conn = None
    try:
        conn = pymysql.connect(**config)
        yield conn
    except pymysql.Error as e:
        print(f"数据库连接错误: {e}")
        raise HTTPException(status_code=500, detail="数据库连接失败")
    finally:
        if conn:
            conn.close()  # 直接关闭，如果已经关闭也无妨


@contextmanager
def get_db_cursor():
    with get_db_connection() as conn:
        cursor = None
        try:
            cursor = conn.cursor()
            yield cursor
            conn.commit()
        except pymysql.Error as e:
            if conn:
                conn.rollback()
            print(f"数据库操作错误: {e}")
            raise HTTPException(status_code=500, detail="数据库操作失败")
        finally:
            if cursor:
                cursor.close()


# region note
class NoteInfo(BaseModel):
    id: str = None
    title: str
    content: str
    tags: str = None

class NoteTree(BaseModel):
    id: str = None
    folderId: str = None
    text: str
    parent_id: str | None = None
    noteId: str | None = None
    sort: float

class NoteFolder(BaseModel):
    id: str = None
    title: str
    parent_id: str | None = None
    linkTxt: str


# 笔记列表 不包含内容
@app.get('/notes/getAll')
def get_notes():
    with get_db_cursor() as cursor:
        query = "SELECT * FROM note_info"
        cursor.execute(query)
        results = cursor.fetchall()

        data = [{
            'id': row['id'],
            'title': row['title'],
            'tags': row['tags'],
            'update_time': row['update_time']
        } for row in results]

        return {"code": 200, "data": data, "message": "success"}


# 笔记详情
@app.get('/notes/getInfo')
def get_notes(id: str):
    with get_db_cursor() as cursor:
        query = "SELECT * FROM note_info WHERE id = %s"
        params = (id)
        cursor.execute(query, params)
        result = cursor.fetchone()

        if not result:
            return {
                "code": 404,
                "data": None,
                "message": "未找到对应的绘图数据"
            }

        # 仅返回关键字段
        key_data = {
            'id': result['id'],
            'title': result['title'],
            'content': result['content'],
            'tags': result['tags'],
            'update_time': result['update_time'],
        }
        return {
            "code": 200,
            "data": key_data,
            "message": "success"
        }


# 未分配的笔记
@app.get('/notes/getRightDataSource')
def get_right_datasource():
    with get_db_cursor() as cursor:
        query = "SELECT * FROM `note_info` WHERE id not IN (SELECT note_id FROM `note_tree` WHERE note_id IS not null);"
        cursor.execute(query)
        results = cursor.fetchall()

        data = [{
            'id': row['id'],
            'text': row['title'],
            'tags': row['tags'],
            'update_time': row['update_time']
        } for row in results]

        return {"code": 200, "data": data, "message": "success"}


# 添加笔记
@app.post('/notes/add')
def add_note(info: NoteInfo):
    with get_db_cursor() as cursor:
        query = """
                INSERT INTO note_info 
                (id, title, content, tags, update_time) 
                VALUES (%s, %s, %s, %s, %s)
                """
        params = (
            str(uuid.uuid4()),  # 使用uuid4更安全
            info.title,
            info.content,
            info.tags,
            datetime.now()
        )

        cursor.execute(query, params)

        return {
            "code": 200,
            "data": None,
            "message": "保存成功"
        }

@app.post('/notes/edit')
def edit_note(info: NoteInfo):
    with get_db_cursor() as cursor:
        query = """
                UPDATE note_info SET title=%s, content=%s, tags=%s WHERE id=%s
                """
        params = (
            info.title,
            info.content,
            info.tags,
            info.id
        )

        cursor.execute(query, params)

        return {
            "code": 200,
            "data": None,
            "message": "保存成功"
        }


@app.post('/notes/add_tree_node')
def add_tree_note(info: NoteTree):
    with get_db_cursor() as cursor:
        query = """
                INSERT INTO note_tree 
                (id, folder_id, node_txt, parent_id, note_id, sort) 
                VALUES (%s, %s, %s, %s, %s, %s)
                """
        params = (
            info.id,
            info.folderId,
            info.text,
            info.parent_id,
            info.noteId,
            info.sort
        )
        cursor.execute(query, params)

        return {
            "code": 200,
            "data": None,
            "message": "保存成功"
        }


@app.post('/notes/add_tree_folder')
def add_tree_folder(info: NoteFolder):
    with get_db_cursor() as cursor:
        query = """
                INSERT INTO note_folder 
                (id, title, parent_id, link_txt) 
                VALUES (%s, %s, %s, %s)
                """
        params = (
            info.id,
            info.title,
            info.parent_id,
            info.linkTxt
        )
        cursor.execute(query, params)

        return {
            "code": 200,
            "data": None,
            "message": "保存成功"
        }


@app.get('/notes/rename_tree_node')
def rename_tree_note(nodeId: str, name: str):
    with get_db_cursor() as cursor:
        query = """
            UPDATE note_tree SET node_txt=%s WHERE id=%s
        """
        params = (
            name,
            nodeId
        )
        cursor.execute(query, params)
        return {
            "code": 200,
            "data": None,
            "message": "修改成功"
        }


@app.post('/notes/rename_tree_folder')
def rename_tree_folder(info: NoteFolder):
    with get_db_cursor() as cursor:
        query = """
            UPDATE note_folder SET title=%s, link_txt=%s WHERE id=%s
        """
        params = (
            info.title,
            info.linkTxt,
            info.id
        )
        cursor.execute(query, params)
        return {
            "code": 200,
            "data": None,
            "message": "修改成功"
        }

# 删除树节点  也可能是删除根文件夹
@app.get('/notes/remove_tree_node')
def remove_tree_note(id: str, isfolder: bool):
    with get_db_cursor() as cursor:
        query = "DELETE FROM note_folder WHERE id=%s" if isfolder else "DELETE FROM note_tree WHERE id=%s"
        # query = """
        #         DELETE FROM note_folder WHERE id=%s
        #         """
        params = (id)
        cursor.execute(query, params)
        return {
            "code": 200,
            "data": None,
            "message": "移除成功"
        }


@app.post('/toggle_visibility')
def toggle_visibility():
    pass
    # data = request.json
    # is_visible = data.get('is_visible')
    # # 处理窗口可见性逻辑
    # new_visibility = not is_visible
    # return jsonify({"new_visibility": new_visibility})


@app.post('/set_always_on_top')
def set_always_on_top():
    pass
    # data = request.json
    # is_top = data.get('is_top')
    # # 处理窗口置顶逻辑
    # new_is_top = not is_top
    # print("new_is_top", new_is_top)
    # return jsonify({"new_is_top": new_is_top})


# endregion

# region vitepress 框架

class DrawData(BaseModel):
    fileName: str
    canvasObj: str
    backgroundObj: str
    draws: str


class DrawInfo(BaseModel):
    fileName: str


@app.get('/vitepress/GetVitePressRoute')
async def getVitePressRoute(type: str):
    with get_db_cursor() as cursor:
        query = "SELECT * FROM note_info_view WHERE link_txt = %s ORDER BY sort asc"
        params = (type)
        cursor.execute(query, params)
        results = cursor.fetchall()

        data = [{
            'id': row['id'],
            'noteid': row['note_id'],
            'title': row['title'],
            'content': row['content'],
            'tags': row['tags'],
            'update_time': row['update_time']
        } for row in results]

        return {"code": 200, "data": data, "message": "success"}


# vitepress 左侧导航菜单数据 考虑排序
@app.get('/vitepress/GetVitePressSidebar')
async def getVitePressSidebar():
    with get_db_cursor() as cursor:
        query = "SELECT * FROM note_sidebar_view ORDER BY folder_id"
        cursor.execute(query)
        results = cursor.fetchall()
        # 转化成树结构
        data = build_nested_structure(results)

        query_other = "SELECT * FROM note_folder where id not IN(SELECT folder_id FROM note_tree)"
        cursor.execute(query_other)
        results_other = cursor.fetchall()
        for item in results_other:
            link_txt = item['link_txt']
            top_entry = {
                'id': item['id'],
                'sort': len(data),
                'text': item['title'],
                'items': [],
                'link_txt': link_txt,
                'folderId': item['id'],
                'parent_id': None
            }
            # 添加到结果
            data[f'/{link_txt}/'] = []
            data[f'/{link_txt}/'].append(top_entry)

        return {"code": 200, "data": data, "message": "success"}

        data = {
            # '/link_txt/': [{
            #     'text': 'title',
            #     'items': [
            #         {'node_txt', 'link': '/link_txt/note_id'}
            #     ]
            # }]
        }

    # '/costs/': [{
    #     'text': '技经手册',
    #     'items': [
    #         {'text': '简介', 'link': '/costs/a'},
    #         {'text': '一级1', 'link': '/costs/b'},
    #         {'text': '一级2', 'link': '/costs/c'},
    #         {'text': '二级准备', 'collapsed': 'false',
    #          'items': [
    #              {'text': '二级1', 'link': '/costs/d'},
    #              {'text': '二级2', 'link': '/costs/e'},
    #          ]
    #          }
    #     ]
    # }],
    # '/designs/': [{
    #     'text': '设计手册',
    #     'items': [
    #         {'text': '简介', 'link': '/designs/a'},
    #         {'text': '一级1', 'link': '/designs/b'},
    #         {'text': '一级2', 'link': '/designs/c'},
    #         {'text': '二级准备', 'collapsed': 'false',
    #          'items': [
    #              {'text': '二级1', 'link': '/designs/d'},
    #              {'text': '二级2', 'link': '/designs/e'},
    #          ]
    #          }
    #     ]
    # }]
    # json_str = json.dumps(data, indent=4)  # indent=4用于美化输出
    # return json_str


def build_nested_structure(results):
    """
    构建嵌套结构
    """
    result = {}

    # 统一处理数据
    processed_results = []
    for item in results:
        # 处理 node.txt 和 node_txt 不一致的问题
        node_txt = item.get('node_txt') or item.get('node.txt')

        processed_item = {
            'id': str(item.get('id', '')),
            'folderId': str(item.get('folder_id', '')),
            'node_txt': node_txt,
            'parent_id': item.get('parent_id'),
            'noteId': item.get('note_id'),
            'text': item.get('title'),
            'link_txt': item.get('link_txt'),
            # 添加排序字段 - 可以根据需要调整排序逻辑
            'sort_order': float(item.get('sort', 0))  # 默认按id排序
        }

        # 处理 parent_id
        if processed_item['parent_id'] in ['', 'None', None]:
            processed_item['parent_id'] = None
        else:
            processed_item['parent_id'] = str(processed_item['parent_id'])

        processed_results.append(processed_item)

    # 按 link_txt 分组
    groups = {}
    for item in processed_results:
        link_txt = item['link_txt']
        if link_txt not in groups:
            groups[link_txt] = []
        groups[link_txt].append(item)

    # 处理每个分组
    for link_txt, items in groups.items():
        # 按 folder_id 分组
        folder_groups = {}
        for item in items:
            folder_id = item['folderId']
            if folder_id not in folder_groups:
                folder_groups[folder_id] = []
            folder_groups[folder_id].append(item)

        # 每个文件夹对应一个顶级条目
        for folder_id, folder_items in folder_groups.items():
            # 找到该文件夹下的顶级节点（parent_id 为 None）
            top_nodes = [item for item in folder_items if item['parent_id'] is None]

            # 对顶级节点进行排序
            top_nodes.sort(key=lambda x: x['sort_order'])

            items_list = []

            # 处理每个顶级节点
            for top_node in top_nodes:
                # 检查这个顶级节点是否有子节点
                children = [item for item in folder_items
                            if item.get('parent_id') == top_node['id']]
                # 对子节点进行排序
                children.sort(key=lambda x: x['sort_order'])

                # 构建节点结构
                if children:
                    # 有子节点的情况 - 创建带有 items 的节点
                    node_dict = {
                        'id': top_node['id'],
                        'sort': top_node['sort_order'],
                        'text': top_node['node_txt'],
                        'link_txt': top_node['link_txt'],
                        'folderId': top_node['folderId'],
                        'parent_id': top_node['parent_id'],
                        'noteId': top_node['noteId']
                    }

                    # 如果 note_id 存在，添加 link
                    if top_node['noteId'] not in [None, '', 'None']:
                        node_dict['link'] = f"/{link_txt}/{top_node['noteId']}"

                    # 添加 collapsed 属性
                    node_dict['collapsed'] = 'false'

                    # 添加子节点
                    node_dict['items'] = []
                    for child in children:
                        child_dict = {
                            'id': child['id'],
                            'sort': child['sort_order'],
                            'text': child['node_txt'],
                            'link_txt': child['link_txt'],
                            'folderId': child['folderId'],
                            'parent_id': child['parent_id'],
                            'noteId': child['noteId']
                        }
                        if child['noteId'] not in [None, '', 'None']:
                            child_dict['link'] = f"/{link_txt}/{child['noteId']}"
                        node_dict['items'].append(child_dict)

                    items_list.append(node_dict)
                else:
                    # 没有子节点的情况 - 直接作为叶子节点
                    node_dict = {
                        'id': top_node['id'],
                        'sort': top_node['sort_order'],
                        'text': top_node['node_txt'],
                        'link_txt': top_node['link_txt'],
                        'folderId': top_node['folderId'],
                        'parent_id': top_node['parent_id'],
                        'noteId': top_node['noteId']
                    }
                    if top_node['noteId'] not in [None, '', 'None']:
                        node_dict['link'] = f"/{link_txt}/{top_node['noteId']}"
                    items_list.append(node_dict)

            # 添加到结果中
            if items_list:
                # 创建顶级条目
                top_entry = {
                    'id': top_nodes[0]['folderId'],
                    'sort': len(result),
                    'text': top_nodes[0]['text'] if top_nodes else link_txt + '手册',
                    'items': items_list,
                    'link_txt': top_nodes[0]['link_txt'],
                    'folderId': top_nodes[0]['folderId'],
                    'parent_id': None
                }
                # id: string;
                # label: string;
                # type: 'folder' | 'bookmark';
                # children?: TreeNode[];
                # 添加到结果
                if f'/{link_txt}/' not in result:
                    result[f'/{link_txt}/'] = []
                result[f'/{link_txt}/'].append(top_entry)

    return result


# home首页 菜单
@app.get('/vitepress/GetHomeActions')
async def getHomeActions():
    with get_db_cursor() as cursor:
        query = "SELECT * FROM note_folder"
        cursor.execute(query)
        results = cursor.fetchall()
        # data = [
        #     {
        #         'theme': 'brand',
        #         'text': '测试1',
        #         'link': '/costs/a'
        #     },
        # ]
        data = [{
            'id': row['id'],
            'title': row['title'],
            'parentId': row['parent_id'],
            'link': row['link_txt'],
        } for row in results]

        return {"code": 200, "data": data, "message": "success"}

# endregion


if __name__ == '__main__':
    try:
        print("启动 Uvicorn 服务器...")
        uvicorn.run("main_note:app", port=5000, reload=True)
    except pymysql.Error as e:
        print(f"连接数据库时出错: {e}")
    finally:
        cursor.close()
        cnx.close()
        print("服务器已关闭")
