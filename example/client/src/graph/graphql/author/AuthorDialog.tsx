import { Modal, Form, Input, Collapse } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { author$$, book$, mutation$ } from "../../__generated_graphql_schema__/fetchers";
import { AuthorInput } from "../../__generated_graphql_schema__/inputs";
import { BookMultiSelect } from "../book/BookMultiSelect";
import { INFORMATION_CLASS, ACTION_CLASS, NOTE_CLASS } from "../Css";
import { useMutation } from "graphql-state";
import { useTypedStateManager } from "../../__generated_graphql_schema__";

const AUTHOR_EDIT_INFO =
    author$$
    .books(book$.id)
;

export const AuthorDialog: FC<{
    value?: ModelType<typeof AUTHOR_EDIT_INFO>,
    onClose: () => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<AuthorInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            bookIds: value?.books?.map(book => book.id) ?? []
        })
    }, [form, value]);

    const stateManager = useTypedStateManager();
    
    const { mutate, loading } = useMutation(
        mutation$.mergeAuthor(AUTHOR_EDIT_INFO),
        {
            onSuccess: data => { 
                stateManager.save(AUTHOR_EDIT_INFO, data.mergeAuthor); 
            }
        }
    )

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
        title={`${value === undefined ? 'Create' : 'Edit'} Author`}
        onOk={onOk}
        onCancel={onCancel}
        width={1000}
        okButtonProps={{loading}}>
            <Form form={form}  labelCol={{span: 8}} wrapperCol={{span: 16}}>
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




/**
 * Document embedded in UI
 */

const WITHOUT_ARGS = "{}";

const WITH_ARGS = "{name: ...}";
 
const NAME_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Author.name'">
                <div className={INFORMATION_CLASS}>
                    If you change this scalar field "Author.name" by any of the following ways
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
                                        If the optimization strategy "Query.findAuthors.associationProperties.dependencies" 
                                        returns undefined or an array contains "name",
                                        re-implement filtering for the association "Query.findAuthors({WITH_ARGS})".
                                        <ul>
                                            <li>
                                                If the optimization strategy "Query.findAuthors.associationProperties.contains" is not specified,
                                                upgrade to re-query
                                            </li>
                                            <li>
                                                Otherwise, ask the user optimization strategy whether the name of the "Book" matches the filtering rules
                                                <ul>
                                                    <li>true: add it into "Query.findAuthors({WITH_ARGS})" if it's not exists</li>
                                                    <li>false: remove it from "Query.findAuthors({WITH_ARGS})" if it's exists</li>
                                                    <li>undefined: upgrade to re-query</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        If the optimization strategy "Book.authors.associationProperties.dependencies" 
                                        returns undefined or an array contains "name",
                                        re-implement filtering for the associations "Book.authors({WITH_ARGS})" of affected "Book" objects.
                                        <ul>
                                            <li>
                                                If the optimization strategy "Book.authors.associationProperties.contains" is not specified,
                                                upgrade to re-query
                                            </li>
                                            <li>
                                                Otherwise, ask the user optimization strategy whether the name of the "Book" matches the filtering rules
                                                <ul>
                                                    <li>true: add it into "Book.authors({WITH_ARGS})" if it's not exists</li>
                                                    <li>false: remove it from "Book.authors({WITH_ARGS})" if it's exists</li>
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
                                        If the optimization strategy "Query.findAuthors.associationProperties.dependencies" 
                                        returns undefined or an array contains "name",
                                        <ol>
                                            <li>Re-implement sorting for the association "Query.findAuthors({WITHOUT_ARGS})"</li>
                                            <li>Re-implement sorting for the association "Query.findAuthors({WITH_ARGS})"</li>
                                        </ol>
                                        <p className={NOTE_CLASS}>
                                            <ul>
                                                <li>
                                                    If the optimization strategy "Query.findAuthors.associationProperties.position" 
                                                    returns undefined, upgrade to re-query.
                                                </li>
                                                <li>
                                                    After re-sorting, if the moved object is the last row of connection whose "hasNext" is true,
                                                    upgrade to re-query.
                                                </li>
                                            </ul>
                                        </p>
                                    </li>
                                    <li>
                                        If the optimization strategy "Book.authors.associationProperties.dependencies" 
                                        returns undefined or an array contains "name",
                                        <ol>
                                            <li>
                                                Re-implement sorting for the associations "Book.authors({WITHOUT_ARGS})" 
                                                of affected "BookStore" objects
                                            </li>
                                            <li>
                                                Re-implement sorting for the associations "Book.authors({WITH_ARGS})" 
                                                of affected "BookStore" objects
                                            </li>
                                        </ol>
                                        <p className={NOTE_CLASS}>
                                            If the optimization strategy "BookStore.books.associationProperties.position" returns undefined,
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
            <Collapse.Panel key="title" header="Description of 'Author.books'">
            <div className={INFORMATION_CLASS}>
                    If you change this association "Author.books"
                    <ul>
                        <li>
                            For each removed book, this action will be executed automatically
                            <div className={ACTION_CLASS}>
                                <ol>
                                    <li>
                                        If "removedBook.authors({WITHOUT_ARGS})" is cached, remove current object form it
                                    </li>
                                    <li>
                                        If "removedBook.authors({WITH_ARGS})" is cached, remove current object form it.
                                    </li>
                                </ol>
                            </div>
                        </li>
                        <li>
                            For each added book, this action will be executed automatically
                            <div className={ACTION_CLASS}>
                                <ol>
                                    <li>
                                        If "addedBook.authors({WITHOUT_ARGS})" is cached, add current object into it
                                    </li>
                                    <li>
                                        If "addedBook.authors({WITH_ARGS})" is cached, TRY to add current object into it.
                                        <ul>
                                            <li>
                                                If the optimization strategy "Book.authors.associationProperties.contains" is not specified, 
                                                upgrade to re-query
                                            </li>
                                            <li>
                                                Otherwise, ask the user optimization strategy whether the name of the "Book" matches the filtering rules
                                                <ul>
                                                    <li>true: do it</li>
                                                    <li>false: ignore it</li>
                                                    <li>undefined: upgrade to re-query behavior</li>
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
 