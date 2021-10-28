import { Modal, Form, Input } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { author$$, book$, mutation$ } from "../../__generated_graphql_schema__/fetchers";
import { AuthorInput } from "../../__generated_graphql_schema__/inputs";
import { BookMultiSelect } from "../book/BookMultiSelect";
import { INFORMATION_CLASS, PSEUDO_CODE_CLASS } from "../Css";
import { useMutation, useStateManager } from "graphql-state";
import { Schema } from "../../__generated_graphql_schema__";

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

    const stateManager = useStateManager<Schema>();
    
    const [mutate, {loading}] = useMutation(
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
                <Form.Item label="Books" name="bookIds">
                    <BookMultiSelect/>
                </Form.Item>
                {BOOKS_DESCRIPTION_ITEM}
            </Form>
        </Modal>
    );
});

const FOR_REMOVED_BOOK = `
if (cached(removeBook.authors)) {
    removeBook.authors.remove(this);
}`;

const FOR_ADDED_BOOK = `
if (cached(addedBook.authors)) {
    addedBook.authors.add(this);
}`;

const BOOKS_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <div className={INFORMATION_CLASS}>
            If you change this association "Author.books"
            <ul>
                <li>
                    For each removed book, this behavior will be executed automatically
                    <pre className={PSEUDO_CODE_CLASS}>{FOR_REMOVED_BOOK}</pre>
                </li>
                <li>
                    For each add book, this behavior will be executed automatically
                    <pre className={PSEUDO_CODE_CLASS}>{FOR_ADDED_BOOK}</pre>
                </li>
            </ul>
        </div>
    </Form.Item>
);