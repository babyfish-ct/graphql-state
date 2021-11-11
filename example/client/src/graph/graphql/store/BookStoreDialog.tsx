import { Modal, Form, Input, Collapse } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { book$, bookStore$$, mutation$ } from "../../__generated_graphql_schema__/fetchers";
import { BookStoreInput } from "../../__generated_graphql_schema__/inputs";
import { BookMultiSelect } from "../book/BookMultiSelect";
import { INFORMATION_CLASS, ACTION_CLASS, NOTE_CLASS } from "../Css";
import { useMutation } from "graphql-state";
import { useTypedStateManager } from "../../__generated_graphql_schema__";

const BOOK_STORE_EDIT_INFO =
    bookStore$$
    .books(
        book$.id
    );

export const BookStoreDialog: FC<{
    value?: ModelType<typeof BOOK_STORE_EDIT_INFO>,
    onClose: () => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<BookStoreInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            bookIds: value?.books.map(book => book.id) ?? []
        })
    }, [form, value]);

    const stateManager = useTypedStateManager();
    
    const { mutate, loading } = useMutation(
        mutation$.mergeBookStore(BOOK_STORE_EDIT_INFO),
        {
            onSuccess: data => {
                stateManager.save(BOOK_STORE_EDIT_INFO, data.mergeBookStore)
            }
        }
    );

    const onOk = useCallback(async () => {
        const input = await form.validateFields();
        await mutate({input});
        onClose();
    }, [form, mutate, onClose]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal 
        visible={true}
        title={`${value === undefined ? 'Create' : 'Edit'} BookStore`}
        onOk={onOk}
        onCancel={onCancel}
        width={1000}
        okButtonProps={{loading}}>
            <Form form={form} labelCol={{span: 8}} wrapperCol={{span: 16}}>
                <Form.Item name="id" hidden={true}/>
                <Form.Item label="Name" name="name">
                    <Input autoComplete="off"/>
                </Form.Item>
                {NAME_DESCRIPTION_ITEM}
                <Form.Item label="Books" name="bookIds">
                    <BookMultiSelect/>
                </Form.Item>
                {BOOKS_DESCRIPTION_ITEM}
            </Form>
        </Modal>
    );
});




/*
 * Document embedded in UI
 */

const WITHOUT_ARGS = "{}";

const WITH_ARGS = "{name: ...}";

const NAME_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'BookStore.name'">
                <div className={INFORMATION_CLASS}>
                    If you change this scalar field "BookStore.name" by any of the following ways
                    <ul>
                        <li>insert: undefined -&gt; newName</li>
                        <li>update: oldName -&gt; newName</li>
                    </ul>
                    <p>
                        (deleting is handled by other logic, we don't dicuss it here)
                    </p>

                    <div>For new name, this action will be executed automatically</div>
                    <div className={ACTION_CLASS}>
                        <ol>
                            <li>
                                Re-filtering
                                <ol>
                                    <li>
                                        If the optimization strategy "Query.findBookStores.associationProperties.dependencies",
                                        returns undefined or an array contains "name",
                                        re-implement filtering for the association "Query.findBookStores({WITH_ARGS})"
                                        <ul>
                                            <li>
                                                If the optimization strategy "Query.findBookStores.associationProperties.contains" is not specified,
                                                upgrade to re-query
                                            </li>
                                            <li>
                                                Otherwise, ask the user optimization strategy whether the name of the "Book" matches the filtering rules
                                                <ul>
                                                    <li>true: add it into "Query.findBookStores({WITH_ARGS})" if it's not exists</li>
                                                    <li>false: remove it from "Query.findBookStores({WITH_ARGS})" if it's exists</li>
                                                    <li>undefined: upgrade to re-query</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                </ol>
                            </li>
                            <li>
                                Re-sorting
                                <ol>
                                    <li>
                                        If the optimization strategy "Query.findBookStores.associationProperties.dependencies",
                                        returns undefined or an array contains "name",
                                        <ol>
                                            <li>
                                                Re-implement sorting for the association "Query.findBookStores({WITHOUT_ARGS})"
                                            </li>
                                            <li>
                                                Re-implement sorting for the association "Query.findBookStores({WITH_ARGS})"
                                            </li>
                                        </ol>
                                        <p className={NOTE_CLASS}>
                                            If the optimization strategy "Query.findBookStore.associationProperties.position" returns undefined,
                                            upgrade to re-query.
                                        </p>
                                    </li>
                                </ol>
                            </li>
                        </ol>
                    </div>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);

const BOOKS_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'BookStore.books'">
            <div className={INFORMATION_CLASS}>
                    If you change this association "BookStore.books"
                    <ul>
                        <li>
                            For each removed book, this action will be executed automatically
                            <div className={ACTION_CLASS}>
                                <ol>
                                    <li>
                                        If "removedBook.store" is cached, set it to undefined
                                    </li>
                                    <li>
                                        If "currentStore.books({WITH_ARGS}) is cached", remove "removedBook" from it.
                                    </li>
                                </ol>
                            </div>
                        </li>
                        <li>
                            For each added book, this action will be executed automatically
                            <div className={ACTION_CLASS}>
                                <ol>
                                    <li>
                                        If "addedBook.store" is cached, set it to current object
                                    </li>
                                    <li>
                                        For each OTHER "BookStore" object in the cache
                                        <ol>
                                            <li>
                                               If "otherStore.books({WITHOUT_ARGS})" is cached, 
                                               Remove "addedBook" from "otherStore.books({WITHOUT_ARGS})"
                                            </li>
                                            <li>
                                               If "otherStore.books({WITH_ARGS})" is cached, 
                                               Remove "addedBook" from "otherStore.books({WITH_ARGS})"
                                            </li> 
                                        </ol>
                                    </li>
                                </ol>
                            </div>
                        </li>
                    </ul>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);
