import { Modal, Form, Input, Collapse } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { author$, book$$, bookStore$, mutation$ } from "../../__generated_graphql_schema__/fetchers";
import { BookInput } from "../../__generated_graphql_schema__/inputs";
import { AuthorMultiSelect } from "../author/AuthorMultiSelect";
import { INFORMATION_CLASS, ACTION_CLASS, NOTE_CLASS } from "../Css";
import { BookStoreSelect } from "../store/BookStoreSelect";
import { useMutation } from "graphql-state";
import { useTypedStateManager } from "../../__generated_graphql_schema__";

const BOOK_EDIT_INFO =
    book$$
    .store(bookStore$.id)
    .authors(author$.id)
;

export const BookDialog: FC<{
    value?: ModelType<typeof BOOK_EDIT_INFO>,
    onClose: () => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<BookInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            storeId: value?.store?.id,
            authorIds: value?.authors.map(author => author.id) ?? []
        })
    }, [form, value]);

    const stateManager = useTypedStateManager();
    
    const { mutate, loading } = useMutation(
        mutation$.mergeBook(
            BOOK_EDIT_INFO
        ),
        {
            onSuccess: data => {
                stateManager.save(BOOK_EDIT_INFO, data.mergeBook);
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
        title={`${value === undefined ? 'Create' : 'Edit'} Book`}
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
                <Form.Item label="Store" name="storeId">
                    <BookStoreSelect optional={true}/>
                </Form.Item>
                {STORE_DESCRITPION_ITEM}
                <Form.Item label="Authors" name="authorIds">
                    <AuthorMultiSelect/>
                </Form.Item>
                {AUTHORS_DESCRIPTION_ITEM}
            </Form>
        </Modal>
    );
});







/************************************
 * 
 * Document embedded in UI
 * 
 ************************************/

const WITHOUT_ARGS = "{}";

const WITH_ARGS = "{name: ...}";

const NAME_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Book.name'">
                <div className={INFORMATION_CLASS}>
                    If you change this scalar field "Book.name" by any of the following ways
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
                                        If the optimization strategy "Query.findBooks.associationProperties.dependencies" 
                                        returns undefined or an array contains "name",
                                        re-implement filtering for the association "Query.findBooks({WITH_ARGS})".
                                        <ul>
                                            <li>
                                                If the optimization strategy "Query.findBooks.associationProperties.contains" is not specified,
                                                upgrade to re-query
                                            </li>
                                            <li>
                                                Otherwise, ask the user optimization strategy whether the name of the "Book" matches the filtering rules
                                                <ul>
                                                    <li>true: add it into "Query.findBooks({WITH_ARGS})" if it's not exists</li>
                                                    <li>false: remove it from "Query.findBooks({WITH_ARGS})" if it's exists</li>
                                                    <li>undefined: upgrade to re-query</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        If the optimization strategy "BookStore.books.associationProperties.dependencies" 
                                        returns undefined or an array contains "name",
                                        re-implement filtering for the associations "BookStore.books({WITH_ARGS})" of affected "BookStore" objects.
                                        <ul>
                                            <li>
                                                If the optimization strategy "BookStore.books.associationProperties.contains" is not specified,
                                                upgrade to re-query
                                            </li>
                                            <li>
                                                Otherwise, ask the user optimization strategy whether the name of the "Book" matches the filtering rules
                                                <ul>
                                                    <li>true: add it into "BookStore.books({WITH_ARGS})" if it's not exists</li>
                                                    <li>false: remove it from "BookStore.books({WITH_ARGS})" if it's exists</li>
                                                    <li>undefined: upgrade to re-query</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        If the optimization strategy "Author.books.associationProperties.dependencies" 
                                        returns undefined or an array contains "name",
                                        re-implement filtering for the associations "Author.books({WITH_ARGS})" of affected "Author" objects.
                                        <ul>
                                            <li>
                                                If the optimization strategy "Author.books.associationProperties.contains" is not specified,
                                                upgrade to re-query
                                            </li>
                                            <li>
                                                Otherwise, ask the user optimization strategy whether the name of the "Book" matches the filtering rules
                                                <ul>
                                                    <li>true: add it into "Athor.books({WITH_ARGS})" if it's not exists</li>
                                                    <li>false: remove it from "Author.books({WITH_ARGS})" if it's exists</li>
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
                                        If the optimization strategy "Query.findBooks.associationProperties.dependencies" 
                                        returns undefined or an array contains "name",
                                        <ol>
                                            <li>Re-implement sorting for the association "Query.findBooks({WITHOUT_ARGS})"</li>
                                            <li>Re-implement sorting for the association "Query.findBooks({WITH_ARGS})"</li>
                                        </ol>
                                        <p className={NOTE_CLASS}>
                                            <ul>
                                                <li>
                                                    If the optimization strategy "Query.findBooks.associationProperties.position" returns undefined,
                                                    upgrade to re-query.
                                                </li>
                                                <li>
                                                    After re-sorting, if the moved object is the last row of connection whose "hasNext" is true,
                                                    upgrade to re-query.
                                                </li>
                                            </ul>
                                        </p>
                                    </li>
                                    <li>
                                        If the optimization strategy "BookStore.books.associationProperties.dependencies" 
                                        returns undefined or an array contains "name",
                                        <ol>
                                            <li>
                                                Re-implement sorting for the associations "BookStore.books({WITHOUT_ARGS})" 
                                                of affected "BookStore" objects
                                            </li>
                                            <li>
                                                Re-implement sorting for the associations "BookStore.books({WITH_ARGS})" 
                                                of affected "BookStore" objects
                                            </li>
                                        </ol>
                                        <p className={NOTE_CLASS}>
                                            If the optimization strategy "BookStore.books.associationProperties.position" returns undefined,
                                            upgrade to re-query.
                                        </p>
                                    </li>
                                    <li>
                                        If the optimization strategy "Author.books.associationProperties.dependencies" 
                                        returns undefined or an array contains "name",
                                        <ol>
                                            <li>
                                                Re-implement sorting for the associations "Author.books({WITHOUT_ARGS})" 
                                                of affected "Author" objects
                                            </li>
                                            <li>
                                                Re-implement sorting for the associations "Auhtor.books({WITH_ARGS})" 
                                                of affected "Author" objects
                                            </li>
                                        </ol>
                                        <p className={NOTE_CLASS}>
                                            If the optimization strategy "Author.books.associationProperties.position" returns undefined,
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

const STORE_DESCRITPION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Book.store'">
            <div className={INFORMATION_CLASS}>
                    If you change this association "Book.store"
                    <ul>
                        <li>
                            For oldStore, this action will be executed automatically
                            <div className={ACTION_CLASS}>
                                <ol>
                                    <li>
                                        If "oldStore" is not undefined and "oldStore.books({WITHOUT_ARGS})" is cached, 
                                        remove current object form "oldStore.books({WITHOUT_ARGS})"
                                    </li>
                                    <li>
                                        If "oldStore" is not undefined and "oldStore.books({WITH_ARGS})" is cached, 
                                        remove current object form "oldStore.books({WITH_ARGS})".
                                    </li>
                                </ol>
                            </div>
                        </li>
                        <li>
                            For newStore, this action will be executed automatically
                            <div className={ACTION_CLASS}>
                                <ol>
                                    <li>
                                        If "newStore" is not undefined and "newStore.books({WITHOUT_ARGS})" is cached, 
                                        add current object into "newStore.books({WITHOUT_ARGS})"
                                    </li>
                                    <li>
                                        If "newStore" is not undefined and "newStore.books({WITH_ARGS})" is cached, 
                                        TRY to add current object into "newStore.books({WITH_ARGS})".
                                        <ul>
                                            <li>
                                                If the optimization strategy "BookStore.books.associationProperties.contains" is not specified, 
                                                upgrade to re-query
                                            </li>
                                            <li>
                                                Otherwise, ask the user optimization strategy whether the name of the "Book" matches the filtering rules
                                                <ul>
                                                    <li>true: do it</li>
                                                    <li>false: ignore it</li>
                                                    <li>undefined: upgrade to re-query</li>
                                                </ul>
                                            </li>
                                        </ul>
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

const AUTHORS_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Book.authors'">
            <div className={INFORMATION_CLASS}>
                    If you change this association "Book.authors"
                    <ul>
                        <li>
                            For each removed author, this action will be executed automatically
                            <div className={ACTION_CLASS}>
                                <ol>
                                    <li>
                                        If "removedAuthor.books({WITHOUT_ARGS})" is cached, remove current object form it
                                    </li>
                                    <li>
                                        If "removedAuthor.books({WITH_ARGS})" is cached, remove current object form it.
                                    </li>
                                </ol>
                            </div>
                        </li>
                        <li>
                            For each added author, this action will be executed automatically
                            <div className={ACTION_CLASS}>
                                <ol>
                                    <li>
                                        If "addedAuthor.books({WITHOUT_ARGS})" is cached, add current object into it
                                    </li>
                                    <li>
                                        If "addedAuthor.books({WITH_ARGS})" is cached, TRY to add current object into it.
                                        <ul>
                                            <li>
                                                If the optimization strategy "Author.books.associationProperties.contains" is not specified, 
                                                upgrade to re-query
                                            </li>
                                            <li>
                                                Otherwise, ask the user optimization strategy whether the name of the "Book" matches the filtering rules
                                                <ul>
                                                    <li>true: do it</li>
                                                    <li>false: ignore it</li>
                                                    <li>undefined: upgrade to re-query</li>
                                                </ul>
                                            </li>
                                        </ul>
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
